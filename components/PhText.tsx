import { isPlaceholder } from '@/content/governance';

/**
 * Renders copy, flagging placeholders (PRD §53) visibly so they can't slip into production unnoticed.
 */
export function PhText({ value, badge, as: Tag = 'span', className = '' }: { value: string; badge?: string; as?: 'span' | 'p' | 'strong' | 'h3' | 'h4'; className?: string }) {
  if (!isPlaceholder(value)) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag className={`${className} ph`} data-placeholder="content" title={badge}>
      {value}
    </Tag>
  );
}
