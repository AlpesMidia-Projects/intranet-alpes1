import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://owzaluztcecawnfyfitu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93emFsdXp0Y2VjYXduZnlmaXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0ODA5NzksImV4cCI6MjA2NzA1Njk3OX0.imdPJj493bb4VVCP9AKb3reDtN6LcmSpELSDcMOmI1M'

export const supabase = createClient(supabaseUrl, supabaseKey)