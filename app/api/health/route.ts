import { NextRequest, NextResponse } from 'next/server';
import { HealthRecord, Rabbit, Disease } from '@/database/index';
import connectDB from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server';
import { Types } from 'mongoose';

/**
 * POST /api/health
 * Create a new health record
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      rabbit_id,
      disease_id,
      date_of_diagnosis,
      treatment_start_date,
      treatment_end_date,
      quarantined,
      notes,
    } = body;

    // Validate required fields
    if (!rabbit_id || !disease_id || !date_of_diagnosis || !treatment_start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that rabbit and disease exist
    const rabbit = await Rabbit.findById(rabbit_id);
    const disease = await Disease.findById(disease_id);

    if (!rabbit) {
      return NextResponse.json({ error: 'Rabbit not found' }, { status: 404 });
    }
    if (!disease) {
      return NextResponse.json({ error: 'Disease not found' }, { status: 404 });
    }

    // Create the health record
    const healthRecord = new HealthRecord({
      user_id: userId,
      rabbit_id: new Types.ObjectId(rabbit_id),
      disease_id: new Types.ObjectId(disease_id),
      date_of_diagnosis: new Date(date_of_diagnosis),
      treatment_start_date: new Date(treatment_start_date),
      treatment_end_date: treatment_end_date ? new Date(treatment_end_date) : null,
      quarantined: Boolean(quarantined),
      notes: notes || null,
    });

    const savedRecord = await healthRecord.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Health record created successfully',
        data: savedRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/health error:', error);
    return NextResponse.json(
      { error: 'Failed to create health record' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/health
 * Update an existing health record
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      id,
      rabbit_id,
      disease_id,
      date_of_diagnosis,
      treatment_start_date,
      treatment_end_date,
      quarantined,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Health record ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!rabbit_id || !disease_id || !date_of_diagnosis || !treatment_start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that rabbit and disease exist
    const rabbit = await Rabbit.findById(rabbit_id);
    const disease = await Disease.findById(disease_id);

    if (!rabbit) {
      return NextResponse.json({ error: 'Rabbit not found' }, { status: 404 });
    }
    if (!disease) {
      return NextResponse.json({ error: 'Disease not found' }, { status: 404 });
    }

    // Find and update the health record
    const healthRecord = await HealthRecord.findOneAndUpdate(
      { _id: id, user_id: userId },
      {
        rabbit_id: new Types.ObjectId(rabbit_id),
        disease_id: new Types.ObjectId(disease_id),
        date_of_diagnosis: new Date(date_of_diagnosis),
        treatment_start_date: new Date(treatment_start_date),
        treatment_end_date: treatment_end_date ? new Date(treatment_end_date) : null,
        quarantined: Boolean(quarantined),
        notes: notes || null,
      },
      { new: true }
    );

    if (!healthRecord) {
      return NextResponse.json(
        { error: 'Health record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Health record updated successfully',
        data: healthRecord,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/health error:', error);
    return NextResponse.json(
      { error: 'Failed to update health record' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/health
 * Delete a health record
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Health record ID is required' },
        { status: 400 }
      );
    }

    const healthRecord = await HealthRecord.findOneAndDelete({
      _id: id,
      user_id: userId,
    });

    if (!healthRecord) {
      return NextResponse.json(
        { error: 'Health record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Health record deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/health error:', error);
    return NextResponse.json(
      { error: 'Failed to delete health record' },
      { status: 500 }
    );
  }
}
