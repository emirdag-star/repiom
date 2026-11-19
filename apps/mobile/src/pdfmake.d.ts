// pdfmake'in tarayıcı derlemesi için tip bildirimi (yalnız kullandığımız kısım).
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    addVirtualFileSystem: (vfs: unknown) => void;
    createPdf: (definition: unknown) => { getBuffer: () => Promise<Uint8Array> };
  };
  export default pdfMake;
}
declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>;
  export default vfs;
}
