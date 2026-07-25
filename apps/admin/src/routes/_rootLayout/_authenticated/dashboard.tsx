import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_rootLayout/_authenticated/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_rootLayout/_authenticated/dashboard"!</div>
}
