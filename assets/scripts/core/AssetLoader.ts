import { AssetManager, assetManager, Asset } from 'cc';
/**
 * AssetLoader - Singleton
 * Quản lý load và cache bundles
 */
export class AssetLoader {
    private static _instance: AssetLoader | null = null;
    private loadedBundles: Map<string, AssetManager.Bundle> = new Map();
    public static get instance(): AssetLoader {
        if (!this._instance) {
            this._instance = new AssetLoader();
        }
        return this._instance;
    }
    /**
     * Load bundle với progress callback
     */
    public loadBundle(
        bundleName: string,
        onProgress?: (finished: number, total: number) => void
    ): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            // Check cache
            if (this.loadedBundles.has(bundleName)) {
                console.log(`✅ Bundle '${bundleName}' cached`);
                if (onProgress) onProgress(1, 1);
                resolve(this.loadedBundles.get(bundleName)!);
                return;
            }
            console.log(`⏳ Loading bundle: ${bundleName}...`);
            assetManager.loadBundle(
                bundleName,
                { onProgress },
                (err, bundle) => {
                    if (err) {
                        console.error(`❌ Load bundle '${bundleName}' failed:`, err);
                        reject(err);
                        return;
                    }
                    console.log(`✅ Bundle '${bundleName}' loaded!`);
                    this.loadedBundles.set(bundleName, bundle);
                    resolve(bundle);
                }
            );
        });
    }
    /**
     * Load asset từ bundle
     */
    public async loadAsset<T extends Asset>(
        bundleName: string,
        path: string,
        type: new (...args: any[]) => T
    ): Promise<T> {
        let bundle = this.loadedBundles.get(bundleName);

        if (!bundle) {
            console.log(`Bundle '${bundleName}' chưa load, loading...`);
            bundle = await this.loadBundle(bundleName);
        }
        return new Promise((resolve, reject) => {
            bundle!.load(path, type, (err, asset) => {
                if (err) {
                    console.error(`❌ Load '${path}' failed:`, err);
                    reject(err);
                    return;
                }
                console.log(`✅ Loaded: ${path}`);
                resolve(asset as T);
            });
        });
    }
    /**
     * Load folder (load tất cả assets trong folder)
     */
    public async loadDir<T extends Asset>(
        bundleName: string,
        dir: string,
        type: new (...args: any[]) => T
    ): Promise<T[]> {
        let bundle = this.loadedBundles.get(bundleName);

        if (!bundle) {
            bundle = await this.loadBundle(bundleName);
        }
        return new Promise((resolve, reject) => {
            bundle!.loadDir(dir, type, (err, assets) => {
                if (err) {
                    console.error(`❌ Load dir '${dir}' failed:`, err);
                    reject(err);
                    return;
                }
                console.log(`✅ Loaded ${assets.length} assets from '${dir}'`);
                resolve(assets as T[]);
            });
        });
    }
    /**
     * Check bundle loaded
     */
    public isBundleLoaded(bundleName: string): boolean {
        return this.loadedBundles.has(bundleName);
    }
    /**
     * Get bundle
     */
    public getBundle(bundleName: string): AssetManager.Bundle | undefined {
        return this.loadedBundles.get(bundleName);
    }
    /**
     * Release bundle
     */
    public releaseBundle(bundleName: string) {
        const bundle = this.loadedBundles.get(bundleName);

        if (!bundle) {
            console.warn(`⚠️ Bundle '${bundleName}' not found`);
            return;
        }
        console.log(`🗑️ Releasing bundle: ${bundleName}`);

        bundle.releaseAll();
        this.loadedBundles.delete(bundleName);
        assetManager.removeBundle(bundle);

        console.log(`✅ Released: ${bundleName}`);
    }
    /**
     * Release all bundles except excludeList
     */
    public releaseAllBundles(excludeList: string[] = []) {
        const toRelease: string[] = [];
        this.loadedBundles.forEach((_, name) => {
            if (excludeList.indexOf(name) === -1) {
                toRelease.push(name);
            }
        });
        toRelease.forEach(name => this.releaseBundle(name));
    }
}