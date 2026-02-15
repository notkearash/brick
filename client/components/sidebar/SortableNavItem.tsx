import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { NavItemProps } from "./NavItem";
import { NavItem } from "./NavItem";

export function SortableNavItem(
  props: Omit<NavItemProps, "dragHandleRef" | "dragHandleListeners">,
) {
  const { table, canReorder } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table, disabled: !canReorder });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
      }}
      {...attributes}
    >
      <NavItem
        {...props}
        dragHandleRef={canReorder ? setActivatorNodeRef : undefined}
        dragHandleListeners={canReorder ? listeners : undefined}
      />
    </div>
  );
}
