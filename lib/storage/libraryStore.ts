import { createClient } from './supabaseClient'
import type { StyleReport, LibraryRecord, SortOrder } from '@/lib/types'

export async function saveToLibrary(
  report: StyleReport,
  imageBase64?: string,
  supabaseIn?: any
): Promise<{ success: boolean; data?: LibraryRecord; error?: string }> {
  try {
    const supabase = supabaseIn || createClient()
    
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not logged in' }
    }

    let thumbnailUrl = report.thumbnailUrl

    // 2. If it's an image upload, store the thumbnail to Supabase Storage
    if (imageBase64 && report.sourceType === 'image') {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      
      const fileName = `${user.id}/${Date.now()}-thumb.jpg`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('style_thumbnails')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Thumbnail upload error', uploadError)
      } else if (uploadData) {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('style_thumbnails')
          .getPublicUrl(fileName)
        
        thumbnailUrl = publicUrlData.publicUrl
      }
    }

    // 3. Save to database
    const { data, error } = await supabase
      .from('style_records')
      .insert({
        user_id: user.id,
        source_type: report.sourceType,
        source_label: report.sourceLabel,
        thumbnail_url: thumbnailUrl || null,
        style_data: report,
        tags: report.tags
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (err: any) {
    console.error('Library save error', err)
    return { success: false, error: err.message }
  }
}

export async function fetchLibrary(sort: SortOrder = 'newest', supabaseIn?: any): Promise<{ data: LibraryRecord[] | null; error?: string }> {
  try {
    const supabase = supabaseIn || createClient()
    const { data, error } = await supabase
      .from('style_records')
      .select('*')
      .order('created_at', { ascending: sort === 'oldest' })

    if (error) throw error
    return { data }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}

export async function deleteFromLibrary(id: string, supabaseIn?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseIn || createClient()
    const { error } = await supabase
      .from('style_records')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Library delete error', err)
    return { success: false, error: err.message }
  }
}

export async function renameInLibrary(id: string, newLabel: string, supabaseIn?: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseIn || createClient()
    const { error } = await supabase
      .from('style_records')
      .update({ source_label: newLabel })
      .eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Library rename error', err)
    return { success: false, error: err.message }
  }
}
