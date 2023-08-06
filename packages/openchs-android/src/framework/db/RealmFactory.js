import Realm from "realm";
import {EntityMappingConfig, RealmProxy} from "openchs-models";
import EncryptionService from "../../service/EncryptionService";

class RealmFactory {
    static async createRealm() {
        const entityMappingConfig = EntityMappingConfig.getInstance();
        const realmConfig = entityMappingConfig.getRealmConfig();

        const encryptionKey = await EncryptionService.getEncryptionKey();
        if(!_.isNil(encryptionKey)) realmConfig.encryptionKey = encryptionKey
        else delete realmConfig.encryptionKey;

        return new RealmProxy(new Realm(realmConfig), entityMappingConfig);
    }

    static createRealmWithoutProxy() {
        console.log('RealmFactory','----------------------------- Loading PLAIN db');
        const entityMappingConfig = EntityMappingConfig.getInstance();
        const realmConfig = entityMappingConfig.getRealmConfig();
        return new Realm(realmConfig);
    }
}

export default RealmFactory;
