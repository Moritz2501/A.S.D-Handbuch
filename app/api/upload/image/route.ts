import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('image');

  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return new Response(JSON.stringify({ error: 'Cloudinary configuration missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'asd_handbook', resource_type: 'image' }, (error, result) => {
      if (error || !result) {
        return reject(error ?? new Error('Upload failed'));
      }
      resolve(result as { secure_url: string });
    });
    stream.end(buffer);
  });

  return NextResponse.json({ url: uploadResult.secure_url });
}
