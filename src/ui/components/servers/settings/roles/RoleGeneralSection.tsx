import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';

interface RoleGeneralSectionProps {
    name: string;
    description: string;
    isEveryone: boolean;
    onChangeName: (value: string) => void;
    onChangeDescription: (value: string) => void;
}

export const RoleGeneralSection = ({
    name,
    description,
    isEveryone,
    onChangeName,
    onChangeDescription,
}: RoleGeneralSectionProps): React.ReactNode => (
    <section className="space-y-4">
        <Heading
            className="border-b border-border-subtle pb-2"
            level={3}
            variant="section"
        >
            General Settings
        </Heading>

        <div className="space-y-2">
            <label
                className="text-xs font-bold text-muted-foreground uppercase"
                htmlFor="roleName"
            >
                Role Name
            </label>
            <Input
                disabled={isEveryone}
                id="roleName"
                type="text"
                value={name}
                variant="secondary"
                onChange={(e): void => {
                    onChangeName(e.target.value);
                }}
            />
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label
                    className="text-xs font-bold text-muted-foreground uppercase"
                    htmlFor="roleDescription"
                >
                    Onboarding Description
                </label>
                <span className="text-xs text-muted-foreground">
                    {description.length} / 200
                </span>
            </div>
            <TextArea
                id="roleDescription"
                maxLength={200}
                placeholder="Briefly describe what this role is for (shown during onboarding)"
                value={description}
                onChange={(e): void => {
                    onChangeDescription(e.target.value);
                }}
            />
            <Text size="xs" variant="muted">
                This description appears on the role card when members pick
                their roles during server onboarding.
            </Text>
        </div>
    </section>
);
