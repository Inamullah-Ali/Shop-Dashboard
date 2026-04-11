import { useTheme } from "./theme-provider";
import { Switch } from "./ui/switch";
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-mono text-black dark:text-white">
        {isDark ? "ON" : "OFF"}
      </span>
      <Switch checked={isDark} onCheckedChange={toggleTheme} className="cursor-pointer" />
    </div>
  );
}





// import { useTheme } from "./theme-provider";
// import { IconSunFilled, IconMoonFilled } from '@tabler/icons-react';
// import { Button } from "./ui/button";
// export function ThemeSwitch() {
//   const { theme, setTheme } = useTheme();

//   const isDark = theme === "dark";

//   function toggleTheme() {
//     setTheme(isDark ? "light" : "dark");
//   }
//   return (
//     <div className="flex items-center space-x-2">
//       {/* <span className="text-sm font-mono text-black dark:text-white">
//         {isDark ? "ON" : "OFF"}
//       </span> */}
// <Button
//   onClick={toggleTheme}
//   variant="outline"
//   size="icon"
//   className="relative w-10 h-10 flex items-center justify-center overflow-hidden"
// >
//   <IconSunFilled
//     className={`
//       text-black hover:text-gray-200
//       absolute left-1/2 -translate-x-1/2 -translate-y-1/2
//       h-5 w-5
//       transition-transform transition-opacity duration-500
//       ${isDark ? "-translate-y-7.5 scale-90 opacity-0" : "translate-y-0 scale-100 opacity-100"}
//     `}
//   />

//   <IconMoonFilled
//     className={`
//       text-white hover:text-gray-200
//       absolute left-1/2 -translate-x-1/2 -translate-y-1/2
//       h-5 w-5
//       transition-transform transition-opacity duration-500 delay-100
//       ${isDark ? "translate-y-0 scale-100 opacity-100" : "translate-y-7.5 scale-90 opacity-0"}
//     `}
//   />
// </Button>

//     </div>
//   );
// }

