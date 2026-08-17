import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui';

/**
 * An honest "not built yet" screen.
 *
 * docs/03_App_Flow.md B5: "A page that says 'not built' is honest; a page that
 * pretends is not." Every route resolves from Phase 10 onward, and each one
 * states plainly which phase fills it in. No mock data, ever.
 */
export function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <EmptyState
      icon={<Construction size={40} strokeWidth={1.5} />}
      title={title}
      body={`This screen is built in Phase ${phase}. The shell, routing and component library are in place; nothing here is mocked.`}
    />
  );
}
