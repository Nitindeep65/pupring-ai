import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Client from '@/models/Client';

function generateClientId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `CLI-${timestamp}-${randomStr}`.toUpperCase();
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { 
      clientName, 
      petName, 
      originalImageUrl, 
      processedImageUrl,
      originalPublicId,
      processedPublicId
    } = body;

    if (!clientName || !petName) {
      return NextResponse.json(
        { error: 'Client name and pet name are required' },
        { status: 400 }
      );
    }

    const clientId = generateClientId();

    const newClient = await Client.create({
      clientId,
      clientName,
      petName,
      originalImage: {
        url: originalImageUrl,
        publicId: originalPublicId
      },
      processedImage: {
        url: processedImageUrl,
        publicId: processedPublicId
      },
      processingStatus: 'completed'
    });

    return NextResponse.json({
      success: true,
      client: newClient
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to save client data' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (clientId) {
      const client = await Client.findOne({ clientId });
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ client });
    }

    const clients = await Client.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}