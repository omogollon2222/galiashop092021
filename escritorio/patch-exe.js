const ResEdit = require('resedit'), fs = require('fs');
const exePath = process.argv[2], icoPath = process.argv[3];
const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
const res = ResEdit.NtExecutableResource.from(exe);
const ico = ResEdit.Data.IconFile.from(fs.readFileSync(icoPath));
const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
const gid = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, lang, ico.icons.map(i => i.data));
const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
vi.setFileVersion(1, 0, 0, 0, 1033); vi.setProductVersion(1, 0, 0, 0, 1033);
vi.setStringValues({ lang: 1033, codepage: 1200 }, {
  FileDescription: 'Galia Shop', ProductName: 'Galia Shop', CompanyName: 'Galia Shop',
  InternalName: 'GaliaShop', OriginalFilename: 'GaliaShop.exe', LegalCopyright: 'Galia Shop',
  FileVersion: '1.0.0', ProductVersion: '1.0.0'
});
vi.outputToResourceEntries(res.entries);
res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log('ok', exePath);
