import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserRole } from '../services/userService.js';
import { parseIsoDateTime } from '../utils/validation.js';

function validateSlotInput(raw) {
  const startAt = parseIsoDateTime(raw?.startAt);
  const endAt = parseIsoDateTime(raw?.endAt);

  if (!startAt || !endAt) {
    return { ok: false, error: 'startAt and endAt must be valid ISO datetimes' };
  }
  if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
    return { ok: false, error: 'startAt must be before endAt' };
  }
  if (new Date(startAt).getTime() <= Date.now()) {
    return { ok: false, error: 'startAt must be in the future' };
  }

  return { ok: true, value: { start_at: startAt, end_at: endAt } };
}

function slotToResponse(slot) {
  return {
    id: slot.id,
    mentorId: slot.mentor_id,
    startAt: slot.start_at,
    endAt: slot.end_at,
    isBooked: slot.is_booked,
    createdAt: slot.created_at,
    updatedAt: slot.updated_at,
  };
}

export async function listAvailabilitySlots(req, res) {
  try {
    const role = await getUserRole(req.user.id);
    const mentorIdFromQuery = req.query.mentor_id;
    const nowIso = new Date().toISOString();

    let query = supabaseAdmin
      .from('availability_slots')
      .select('id, mentor_id, start_at, end_at, is_booked, created_at, updated_at')
      .order('start_at', { ascending: true });

    if (role === 'mentor') {
      query = query.eq('mentor_id', req.user.id);
    } else if (role === 'student') {
      if (!mentorIdFromQuery || typeof mentorIdFromQuery !== 'string') {
        return res.status(400).json({ error: 'mentor_id is required for students' });
      }
      query = query
        .eq('mentor_id', mentorIdFromQuery)
        .eq('is_booked', false)
        .gt('start_at', nowIso);
    } else if (role === 'admin' && typeof mentorIdFromQuery === 'string') {
      query = query.eq('mentor_id', mentorIdFromQuery);
    } else if (typeof mentorIdFromQuery === 'string') {
      query = query.eq('mentor_id', mentorIdFromQuery);
    }

    const { data, error } = await query;
    if (error) {
      console.error('listAvailabilitySlots error', error);
      return res.status(500).json({ error: 'Failed to load availability slots' });
    }

    return res.json({ items: (data || []).map(slotToResponse) });
  } catch (err) {
    console.error('listAvailabilitySlots exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createAvailabilitySlots(req, res) {
  try {
    const incoming = Array.isArray(req.body?.slots)
      ? req.body.slots
      : [{ startAt: req.body?.startAt, endAt: req.body?.endAt }];

    if (!incoming.length) {
      return res.status(400).json({ error: 'At least one slot is required' });
    }

    const rows = [];
    for (const slot of incoming) {
      const validated = validateSlotInput(slot);
      if (!validated.ok) {
        return res.status(400).json({ error: validated.error });
      }
      rows.push({
        mentor_id: req.user.id,
        ...validated.value,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('availability_slots')
      .insert(rows)
      .select('id, mentor_id, start_at, end_at, is_booked, created_at, updated_at');

    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('overlap') || message.includes('exclude')) {
        return res.status(409).json({ error: 'One or more slots overlap an existing slot' });
      }
      console.error('createAvailabilitySlots error', error);
      return res.status(500).json({ error: 'Failed to create availability slots' });
    }

    return res.status(201).json({ items: (data || []).map(slotToResponse) });
  } catch (err) {
    console.error('createAvailabilitySlots exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAvailabilitySlot(req, res) {
  try {
    const slotId = req.params.id;
    const validated = validateSlotInput(req.body);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const { data, error } = await supabaseAdmin
      .from('availability_slots')
      .update(validated.value)
      .eq('id', slotId)
      .eq('mentor_id', req.user.id)
      .select('id, mentor_id, start_at, end_at, is_booked, created_at, updated_at')
      .maybeSingle();

    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes('overlap') || message.includes('exclude')) {
        return res.status(409).json({ error: 'Updated slot overlaps another slot' });
      }
      console.error('updateAvailabilitySlot error', error);
      return res.status(500).json({ error: 'Failed to update slot' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    return res.json(slotToResponse(data));
  } catch (err) {
    console.error('updateAvailabilitySlot exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAvailabilitySlot(req, res) {
  try {
    const slotId = req.params.id;

    const { data: existing, error: readError } = await supabaseAdmin
      .from('availability_slots')
      .select('id, is_booked')
      .eq('id', slotId)
      .eq('mentor_id', req.user.id)
      .maybeSingle();

    if (readError) {
      console.error('deleteAvailabilitySlot read error', readError);
      return res.status(500).json({ error: 'Failed to load slot' });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (existing.is_booked) {
      return res.status(409).json({ error: 'Cannot delete a booked slot' });
    }

    const { error } = await supabaseAdmin
      .from('availability_slots')
      .delete()
      .eq('id', slotId)
      .eq('mentor_id', req.user.id);

    if (error) {
      console.error('deleteAvailabilitySlot delete error', error);
      return res.status(500).json({ error: 'Failed to delete slot' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteAvailabilitySlot exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

