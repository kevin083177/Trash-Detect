import { Ionicons } from "@expo/vector-icons";

interface TabBarIconProps {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    size?: number;
};
  
export function TabBarIcon({ size, name, color }: TabBarIconProps) {
    return <Ionicons size={size ? size : 26} name={name} color={color} />;
}