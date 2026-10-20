import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  path?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 overflow-x-auto text-sm text-muted-foreground">
      <Link to="/degrees" className="shrink-0 transition-colors hover:text-foreground">
        Degrees
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true">/</span>
          {item.path ? (
            <Link to={item.path} className="truncate transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-foreground/80">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}
