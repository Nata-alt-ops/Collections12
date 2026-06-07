// Декларация для SCSS файлов
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Декларация для CSS файлов
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}