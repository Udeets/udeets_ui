-- Expand the deet-media bucket to allow file attachments (PDF, Word, Excel,
-- PowerPoint, text, CSV, zip) alongside images. Required by the composer's
-- "Attach File" flow which uploads documents with kind="file".
--
-- Image size limit is already sufficient; raising the overall cap to 15 MB
-- so docs up to that size can be uploaded.

update storage.buckets
set
  file_size_limit = 15728640,  -- 15 MB
  allowed_mime_types = array[
    -- images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    -- documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    -- text
    'text/plain',
    'text/csv',
    -- archives
    'application/zip'
  ]
where id = 'deet-media';
