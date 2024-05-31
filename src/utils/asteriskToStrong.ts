export default function convertAsteriskToStrongTag(str: string) {
  return str.replace(
    /\*{1,2}(.*?)\*{1,2}/g,
    `<bold class="font-normal font-extrabold">$1</bold>`
  );
}