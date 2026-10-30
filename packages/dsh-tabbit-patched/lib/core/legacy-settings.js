/* DSH 0.2 把旧 settings.yaml 导入 profile；tabbit 节与插件行 id 不同，需单独迁移。 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
const SETTING_KEYS = ['instance', 'launcherPath', 'pageAccess', 'intranetFetch'];
const MIGRATION_MARKER = '.dsh-tabbit-settings-migrated';
/* 旧文件可能尚未被宿主改名，也可能已经留在 .imported 备份里。 */
async function readLegacySection(home) {
    for (const name of ['settings.yaml', 'settings.yaml.imported']) {
        let text;
        try {
            text = await readFile(join(home, name), 'utf8');
        }
        catch (error) {
            if (error.code === 'ENOENT')
                continue;
            throw error;
        }
        const document = parse(text);
        if (document === null || typeof document !== 'object' || Array.isArray(document))
            continue;
        const section = document.tabbit;
        if (section !== null && typeof section === 'object' && !Array.isArray(section)) {
            return section;
        }
    }
    return undefined;
}
/* 只取旧版确实支持的四项，避免把无效值写进新版 profile。 */
function validLegacyValues(section) {
    const result = {};
    if (typeof section.instance === 'string')
        result.instance = section.instance;
    if (typeof section.launcherPath === 'string')
        result.launcherPath = section.launcherPath;
    if (section.pageAccess === 'ask' || section.pageAccess === 'always' || section.pageAccess === 'never') {
        result.pageAccess = section.pageAccess;
    }
    if (section.intranetFetch === 'ask' || section.intranetFetch === 'always' || section.intranetFetch === 'never') {
        result.intranetFetch = section.intranetFetch;
    }
    return result;
}
/* 新配置优先；成功后写 profile 级标记，避免用户重置字段时被旧值再次覆盖。 */
export async function migrateLegacySettings(ctx) {
    const profile = ctx.get('profileContext');
    if (profile === undefined)
        return;
    const marker = join(profile.dir, MIGRATION_MARKER);
    try {
        await readFile(marker);
        return;
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    const legacy = await readLegacySection(profile.home);
    if (legacy === undefined)
        return;
    const loader = ctx.root.loader;
    if (loader === undefined)
        return;
    await loader.await();
    const settings = ctx.settings;
    const descriptor = settings.describe().find((entry) => entry.ns === 'tabbit-browser');
    if (descriptor === undefined)
        throw new Error('tabbit-browser settings form is not active');
    const existing = descriptor.user !== null && typeof descriptor.user === 'object'
        ? descriptor.user
        : {};
    const values = validLegacyValues(legacy);
    const patch = Object.fromEntries(SETTING_KEYS.flatMap((key) => values[key] !== undefined && !Object.hasOwn(existing, key) ? [[key, values[key]]] : []));
    if (Object.keys(patch).length > 0)
        await settings.update('tabbit-browser', patch, descriptor.revision);
    await writeFile(marker, 'migrated\n', { flag: 'wx' }).catch((error) => {
        if (error.code !== 'EEXIST')
            throw error;
    });
}
