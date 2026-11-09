import { Heading } from '@/ui/primitives/Heading';
import { Input } from '@/ui/primitives/Input';
import { Label } from '@/ui/primitives/Label';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';

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
            <Label htmlFor="roleName">Role Name</Label>
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
                <Label htmlFor="roleDescription">Onboarding Description</Label>
                <Text size="xs" variant="muted">
                    {description.length} / 200
                </Text>
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
