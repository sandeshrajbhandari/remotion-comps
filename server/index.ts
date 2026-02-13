import express from 'express';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition, getCompositions } from '@remotion/renderer';
import { enableTailwind } from '@remotion/tailwind';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS middleware to allow cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files from renders directory
app.use('/renders', express.static(path.resolve('./renders')));

// Serve static files from public directory
app.use('/public', express.static(path.resolve('./public')));

// Validation schemas
const renderVideoSchema = z.object({
    compositionId: z.string(),
    inputProps: z.record(z.any()).optional(),
    compositionCache: z.boolean().optional().default(false),
    codec: z.enum(['h264', 'h265', 'prores']).optional().default('h264'),
});

const renderStillSchema = z.object({
    compositionId: z.string(),
    inputProps: z.record(z.any()).optional(),
    compositionCache: z.boolean().optional().default(false),
});

let bundleLocation: string | null = null;

// Initialize bundle once
async function initializeBundle() {
    if (!bundleLocation) {
        console.log('Creating bundle...');
        bundleLocation = await bundle({
            entryPoint: path.resolve('./src/index.ts'),
            webpackOverride: (config) => enableTailwind(config),
        });
        console.log('Bundle created at:', bundleLocation);
    }
    return bundleLocation;
}


// Generate filename with timestamp
function generateFilename(compositionId: string, isStill: boolean = false): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = isStill ? 'png' : 'mp4';
    return `${compositionId}_${timestamp}.${extension}`;
}

// Check if cached file exists for composition
async function getCachedFile(compositionId: string, isStill: boolean = false): Promise<string | null> {
    try {
        const rendersDir = path.resolve('./renders');
        const files = await fs.readdir(rendersDir);

        // Look for files that start with the composition ID
        const cachedFile = files.find(file => {
            const extension = isStill ? '.png' : '.mp4';
            return file.startsWith(compositionId) && file.endsWith(extension);
        });

        if (cachedFile) {
            return path.join(rendersDir, cachedFile);
        }

        return null;
    } catch (error) {
        console.error('Error checking for cached file:', error);
        return null;
    }
}

// Ensure renders directory exists
async function ensureRendersDir() {
    const rendersDir = path.resolve('./renders');
    try {
        await fs.access(rendersDir);
    } catch {
        await fs.mkdir(rendersDir, { recursive: true });
    }
}

// Ensure public directory exists
async function ensurePublicDir() {
    const publicDir = path.resolve('./public');
    try {
        await fs.access(publicDir);
    } catch {
        await fs.mkdir(publicDir, { recursive: true });
    }
}

// Build file tree for public directory
async function buildPublicFileTree(): Promise<any[]> {
    const publicDir = path.resolve('./public');

    async function buildTree(dirPath: string, relativePath: string = ''): Promise<any[]> {
        const items = await fs.readdir(dirPath);
        const tree = [];

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const relativeItemPath = path.join(relativePath, item).replace(/\\/g, '/');
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                const children = await buildTree(fullPath, relativeItemPath);
                tree.push({
                    name: item,
                    path: relativeItemPath,
                    type: 'directory',
                    children: children
                });
            } else {
                tree.push({
                    name: item,
                    path: relativeItemPath,
                    type: 'file',
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        }

        return tree.sort((a, b) => {
            // Sort directories first, then files alphabetically
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    return await buildTree(publicDir);
}

// Save base64 image to public directory
async function saveBase64Image(base64Data: string): Promise<string> {
    try {
        await ensurePublicDir();

        // Extract mime type and data from base64 string
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
        }

        const mimeType = matches[1];
        const base64String = matches[2];

        // Determine file extension from mime type
        const extension = mimeType.split('/')[1] || 'png';

        // Generate unique filename
        const hash = crypto.createHash('md5').update(base64String).digest('hex');
        const filename = `uploaded_${hash}.${extension}`;
        const filePath = path.resolve('./public', filename);

        // Convert base64 to buffer and save
        const buffer = Buffer.from(base64String, 'base64');
        await fs.writeFile(filePath, buffer);

        return filename;
    } catch (error) {
        console.error('Error saving base64 image:', error);
        throw new Error('Failed to save base64 image');
    }
}

// Clean up old files (optional - keeps last 10 files per composition)
async function cleanupOldFiles(compositionId: string, isStill: boolean = false) {
    try {
        const rendersDir = path.resolve('./renders');
        const files = await fs.readdir(rendersDir);
        const extension = isStill ? '.png' : '.mp4';

        const compositionFiles = files
            .filter(file => file.startsWith(compositionId) && file.endsWith(extension))
            .map(file => ({
                name: file,
                path: path.join(rendersDir, file),
                stats: null as any
            }));

        // Get file stats for sorting by modification time
        for (const file of compositionFiles) {
            try {
                file.stats = await fs.stat(file.path);
            } catch {
                // File might have been deleted, skip it
            }
        }

        // Sort by modification time (newest first)
        compositionFiles.sort((a, b) => {
            if (!a.stats || !b.stats) return 0;
            return b.stats.mtime.getTime() - a.stats.mtime.getTime();
        });

        // Keep only the 10 most recent files
        const filesToDelete = compositionFiles.slice(10);
        for (const file of filesToDelete) {
            try {
                await fs.unlink(file.path);
                console.log(`Cleaned up old file: ${file.name}`);
            } catch (error) {
                console.error(`Error deleting file ${file.name}:`, error);
            }
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// POST /render/video - Render a video composition
app.post('/render/video', async (req, res) => {
    try {
        const validatedData = renderVideoSchema.parse(req.body);
        const { compositionId, inputProps = {}, compositionCache, codec } = validatedData;

        // Check for cached file if compositionCache is enabled
        if (compositionCache) {
            const cachedFile = await getCachedFile(compositionId, false);
            if (cachedFile) {
                const filename = path.basename(cachedFile);
                return res.json({
                    success: true,
                    message: 'Using cached video',
                    filename,
                    url: `/renders/${filename}`,
                    cached: true
                });
            }
        }

        // Initialize bundle
        const bundlePath = await initializeBundle();

        // Get composition
        const composition = await selectComposition({
            serveUrl: bundlePath,
            id: compositionId,
            inputProps,
        });

        // Generate filename
        const filename = generateFilename(compositionId, false);
        const outputPath = path.resolve('./renders', filename);

        // Ensure renders directory exists
        await ensureRendersDir();

        // Render video
        console.log(`Rendering video: ${compositionId} to ${filename}`);
        await renderMedia({
            composition,
            serveUrl: bundlePath,
            codec,
            outputLocation: outputPath,
            inputProps,
        });

        // Clean up old files
        await cleanupOldFiles(compositionId, false);

        res.json({
            success: true,
            message: 'Video rendered successfully',
            filename,
            url: `/renders/${filename}`,
            cached: false
        });

    } catch (error) {
        console.error('Error rendering video:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// POST /render/still - Render a still image
app.post('/render/still', async (req, res) => {
    try {
        const validatedData = renderStillSchema.parse(req.body);
        const { compositionId, inputProps = {}, compositionCache } = validatedData;

        // Check for cached file if compositionCache is enabled
        if (compositionCache) {
            const cachedFile = await getCachedFile(compositionId, true);
            if (cachedFile) {
                const filename = path.basename(cachedFile);
                return res.json({
                    success: true,
                    message: 'Using cached still',
                    filename,
                    url: `/renders/${filename}`,
                    cached: true
                });
            }
        }

        // Initialize bundle
        const bundlePath = await initializeBundle();

        // Get composition
        const composition = await selectComposition({
            serveUrl: bundlePath,
            id: compositionId,
            inputProps,
        });

        // Generate filename
        const filename = generateFilename(compositionId, true);
        const outputPath = path.resolve('./renders', filename);

        // Ensure renders directory exists
        await ensureRendersDir();

        // Render still
        console.log(`Rendering still: ${compositionId} to ${filename}`);
        await renderStill({
            composition,
            serveUrl: bundlePath,
            output: outputPath,
            inputProps,
        });
        // Clean up old files
        await cleanupOldFiles(compositionId, true);

        res.json({
            success: true,
            message: 'Still rendered successfully',
            filename,
            url: `/renders/${filename}`,
            cached: false
        });

    } catch (error) {
        console.error('Error rendering still:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// GET /compositions - List available compositions
app.get('/compositions', async (req, res) => {
    try {
        // Initialize bundle to ensure it's ready
        const bundlePath = await initializeBundle();

        // Get compositions from the bundle
        const compositions = await getCompositions(bundlePath);

        // Extract inputProps information from defaultProps
        const compositionsWithSchema = compositions.map(comp => {
            console.log(comp)
            return {
                id: comp.id,
                // durationInFrames: comp.durationInFrames,
                // fps: comp.fps,
                // width: comp.width,
                // height: comp.height,
                defaultProps: comp.defaultProps,
            };
        });

        // Build file tree for public directory
        const publicFileTree = await buildPublicFileTree();

        res.json({
            success: true,
            compositions: compositionsWithSchema,
            publicFileTree: publicFileTree
        });
    } catch (error) {
        console.error('Error listing compositions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// GET /renders - List rendered files
app.get('/renders', async (req, res) => {
    try {
        const rendersDir = path.resolve('./renders');
        const files = await fs.readdir(rendersDir);

        const fileInfo = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(rendersDir, file);
                const stats = await fs.stat(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    type: file.endsWith('.mp4') ? 'video' : file.endsWith('.png') ? 'still' : 'unknown'
                };
            })
        );

        res.json({
            success: true,
            files: fileInfo.sort((a, b) => b.modified.getTime() - a.modified.getTime())
        });
    } catch (error) {
        console.error('Error listing renders:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// DELETE /renders/:filename - Delete a specific rendered file
app.delete('/renders/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.resolve('./renders', filename);

        await fs.unlink(filePath);

        res.json({
            success: true,
            message: `File ${filename} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// POST /upload/image - Upload base64 image
app.post('/upload/image', async (req, res) => {
    try {
        const { base64Data } = req.body;

        if (!base64Data || typeof base64Data !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'base64Data is required and must be a string'
            });
        }

        if (!base64Data.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid base64 image format. Must start with "data:image/"'
            });
        }

        const filename = await saveBase64Image(base64Data);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            filename,
            url: `/public/${filename}`
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Serve the gallery HTML page
app.get('/gallery', (req, res) => {
    res.sendFile(path.resolve('./composition-gallery.html'));
});

// GET /assets - List available media assets (videos, backdrops, avatars) for prompt crafting
app.get('/assets', async (req, res) => {
    try {
        const publicDir = path.resolve('./public');
        
        // Helper function to read files from a directory
        async function getAssetsFromDir(dirPath: string, category: string): Promise<any[]> {
            try {
                const fullPath = path.join(publicDir, dirPath);
                await fs.access(fullPath);
                const files = await fs.readdir(fullPath);
                
                const assets = await Promise.all(
                    files
                        .filter(file => {
                            // Filter by common media extensions
                            const ext = path.extname(file).toLowerCase();
                            if (category === 'videos') {
                                return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
                            } else {
                                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
                            }
                        })
                        .map(async (file) => {
                            const filePath = path.join(fullPath, file);
                            const stats = await fs.stat(filePath);
                            const relativePath = path.join(dirPath, file).replace(/\\/g, '/');
                            
                            return {
                                name: file,
                                path: relativePath, // e.g., "videos/Big_Buck_Bunny_360_10s_1MB.mp4"
                                url: `/public/${relativePath}`, // Full URL path
                                size: stats.size,
                                sizeFormatted: formatFileSize(stats.size),
                                modified: stats.mtime.toISOString(),
                                extension: path.extname(file).toLowerCase().slice(1)
                            };
                        })
                );
                
                return assets.sort((a, b) => a.name.localeCompare(b.name));
            } catch (error) {
                // Directory doesn't exist or can't be read
                return [];
            }
        }
        
        // Helper function to format file size
        function formatFileSize(bytes: number): string {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
        
        // Get assets from each category
        const [videos, backdrops, avatars] = await Promise.all([
            getAssetsFromDir('videos', 'videos'),
            getAssetsFromDir('backdrops', 'images'),
            getAssetsFromDir('avatars', 'images')
        ]);
        
        // Also get any other assets in the root public directory (not in subdirectories)
        let otherAssets: any[] = [];
        try {
            const rootFiles = await fs.readdir(publicDir);
            const filePromises = rootFiles.map(async (file) => {
                const filePath = path.join(publicDir, file);
                const stats = await fs.stat(filePath);
                // Only include files (not directories) that are in the root
                if (stats.isFile()) {
                    return {
                        name: file,
                        path: file, // Root level file
                        url: `/public/${file}`,
                        size: stats.size,
                        sizeFormatted: formatFileSize(stats.size),
                        modified: stats.mtime.toISOString(),
                        extension: path.extname(file).toLowerCase().slice(1)
                    };
                }
                return null;
            });
            
            const results = await Promise.all(filePromises);
            otherAssets = results.filter((item): item is NonNullable<typeof item> => item !== null);
        } catch (error) {
            // Ignore errors reading root directory
        }
        
        res.json({
            success: true,
            assets: {
                videos: {
                    count: videos.length,
                    items: videos,
                    description: 'Video files available for VideoScreen composition. Use the "path" field in videoSource prop.'
                },
                backdrops: {
                    count: backdrops.length,
                    items: backdrops,
                    description: 'Background images available for ImageScreen and other compositions. Use the "path" field in imageSource prop.'
                },
                avatars: {
                    count: avatars.length,
                    items: avatars,
                    description: 'Avatar images available for AvatarScreen composition. Use the "path" field in imageSource prop.'
                },
                other: {
                    count: otherAssets.length,
                    items: otherAssets,
                    description: 'Other assets in the public directory root'
                }
            },
            usage: {
                videos: 'Use the "path" value (e.g., "videos/Big_Buck_Bunny_360_10s_1MB.mp4") in VideoScreen composition videoSource prop',
                backdrops: 'Use the "path" value (e.g., "backdrops/gradient-bg-1.jpg") in ImageScreen composition imageSource prop',
                avatars: 'Use the "path" value (e.g., "avatars/avatar-hand-fold.png") in AvatarScreen composition imageSource prop'
            }
        });
    } catch (error) {
        console.error('Error listing assets:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Remotion render server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Available compositions: http://localhost:${PORT}/compositions`);
    console.log(`Available assets: http://localhost:${PORT}/assets`);
    console.log(`Composition Gallery: http://localhost:${PORT}/gallery`);
});

export default app;
