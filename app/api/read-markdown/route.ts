// app/api/read-markdown/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ParsedFile {
  filename: string;
  links: string[];
}

export async function POST(request: Request) {
  try {
    const { path: dirPath } = await request.json();

    if (!dirPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ error: 'Directory does not exist' }, { status: 404 });
    }

    // Read all files in directory
    const files = fs.readdirSync(dirPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      return NextResponse.json({ error: 'No markdown files found' }, { status: 404 });
    }

    // Parse each markdown file
    const parsedFiles: ParsedFile[] = [];
    const allFileNames = new Set(markdownFiles.map(f => f.replace('.md', '')));

    for (const file of markdownFiles) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract [[wikilinks]]
      const linkRegex = /\[\[([^\]]+)\]\]/g;
      const links: string[] = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        links.push(match[1]);
      }

      parsedFiles.push({
        filename: file.replace('.md', ''),
        links
      });
    }

    // Create nodes
    const nodeMap = new Map<string, number>();
    const nodes: any[] = [];
    let nodeId = 1;

    // First, create nodes for all actual files
    parsedFiles.forEach((file, index) => {
      const angle = (index / parsedFiles.length) * 2 * Math.PI;
      const radius = 300;
      const centerX = 600;
      const centerY = 400;

      nodeMap.set(file.filename, nodeId);
      nodes.push({
        id: nodeId,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: file.filename,
        connections: [],
        isOrphan: false
      });
      nodeId++;
    });

    // Then, create orphan nodes for links that don't have files
    const orphanLinks = new Set<string>();
    parsedFiles.forEach(file => {
      file.links.forEach(link => {
        if (!allFileNames.has(link) && !orphanLinks.has(link)) {
          orphanLinks.add(link);
        }
      });
    });

    orphanLinks.forEach((link, index) => {
      const angle = (index / orphanLinks.size) * 2 * Math.PI;
      const radius = 450;
      const centerX = 600;
      const centerY = 400;

      nodeMap.set(link, nodeId);
      nodes.push({
        id: nodeId,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: link,
        connections: [],
        isOrphan: true
      });
      nodeId++;
    });

    // Now add connections
    parsedFiles.forEach(file => {
      const sourceId = nodeMap.get(file.filename);
      if (sourceId) {
        file.links.forEach(link => {
          const targetId = nodeMap.get(link);
          if (targetId && !nodes[sourceId - 1].connections.includes(targetId)) {
            nodes[sourceId - 1].connections.push(targetId);
          }
        });
      }
    });

    return NextResponse.json({ nodes });

  } catch (error: any) {
    console.error('Error reading markdown files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}