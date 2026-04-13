import { redirect } from 'next/navigation'
// Backoffice é aplicação separada — acessível em /admin
export default function BackofficePage() {
  redirect('/admin')
}
