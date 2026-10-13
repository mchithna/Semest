import { ChevronRight } from 'lucide-react'
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
    <nav className="flex items-center text-sm font-mono whitespace-nowrap overflow-x-auto pb-2 mb-4 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible text-muted-foreground">
      <Link to="/degrees" className="hover:text-emerald-400 transition-colors">
        Degrees
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-2 shrink-0 text-muted-foreground" />
          {item.path ? (
            <Link to={item.path} className="hover:text-emerald-400 transition-colors truncate max-w-[150px] sm:max-w-[200px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-bold truncate max-w-[150px] sm:max-w-[200px]">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}
