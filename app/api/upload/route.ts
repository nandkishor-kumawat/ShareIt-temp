import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileData = {
      id: Date.now() + '-' + Math.round(Math.random() * 1E9),
      name: file.name,
      size: file.size,
      type: file.type,
      data: buffer.toString('base64'),
      timestamp: Date.now()
    };

    // Return the file data to the client, which will broadcast it via socket
    return NextResponse.json({ success: true, fileData });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
