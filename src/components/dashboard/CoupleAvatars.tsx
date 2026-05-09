import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarMember {
  uuid: string;
  name: string;
  avatarUrl?: string;
}

interface CoupleAvatarsProps {
  members: AvatarMember[];
}

export function CoupleAvatars({ members }: CoupleAvatarsProps) {
  const visible = members.slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <div className="flex">
      {visible.map((member, index) => (
        <Avatar
          key={member.uuid}
          className={`size-8 ring-2 ring-[var(--color-bg-elev)] ${index > 0 ? "-ml-2" : ""}`}
        >
          <AvatarImage src={member.avatarUrl} alt={member.name} />
          <AvatarFallback className="text-xs font-medium bg-[var(--color-brand-200)] text-[var(--color-brand-800)]">
            {member.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
