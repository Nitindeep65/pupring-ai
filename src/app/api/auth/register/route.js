import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function POST(request) {
  try {
    await dbConnect();
    
    const { username, password, email } = await request.json();

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 400 }
      );
    }

    const newAdmin = await Admin.create({
      username,
      password,
      email
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin._id,
        username: newAdmin.username,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register admin' },
      { status: 500 }
    );
  }
}