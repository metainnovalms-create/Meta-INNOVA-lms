import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const newsletterId = url.searchParams.get('id');
    
    if (!newsletterId) {
      return new Response(
        JSON.stringify({ error: 'Missing newsletter ID' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Get newsletter record
    const { data: newsletter, error: fetchError } = await supabase
      .from('newsletters')
      .select('file_path, file_name, pdf_url')
      .eq('id', newsletterId)
      .single();
    
    if (fetchError || !newsletter) {
      console.error('Newsletter fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Newsletter not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Determine file path - use file_path if available, otherwise extract from pdf_url
    let filePath = newsletter.file_path;
    if (!filePath && newsletter.pdf_url) {
      try {
        const urlObj = new URL(newsletter.pdf_url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf('newsletters');
        if (bucketIndex !== -1) {
          filePath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch (e) {
        console.error('Error parsing pdf_url:', e);
      }
    }
    
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File path not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Downloading file from path:', filePath);
    
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('newsletters')
      .download(filePath);
    
    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'File not found in storage' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Increment download count using the RPC function
    const { error: rpcError } = await supabase.rpc('increment_newsletter_downloads', { 
      newsletter_id: newsletterId 
    });
    
    if (rpcError) {
      console.error('Error incrementing download count:', rpcError);
      // Don't fail the download for this error
    }
    
    // Return file with proper headers for download
    const fileName = newsletter.file_name || 'newsletter.pdf';
    
    return new Response(fileData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Cache-Control': 'no-cache',
      },
    });
    
  } catch (error) {
    console.error('Error in download-newsletter function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
