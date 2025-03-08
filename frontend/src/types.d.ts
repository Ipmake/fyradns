declare namespace Types {
    interface BaseUser {
        id: number
        username: string
        email?: string
        name: string
        isApi: boolean
        isAdmin: boolean
        enabled: boolean
    }

    interface UIUserCreate extends BaseUser {
        password: string
        confirmPassword: string
    }

    interface AuthedUser extends BaseUser {
        token: string
    }

    interface Zone {
        domain: string
        description?: string
        ttl?: number
        refresh?: number
        retry?: number   
        expire?: number
        minimum?: number
        serial?: number
        enabled: boolean
    }

    interface ACL {
        id: number
        zoneDomain: string
        ipAddresses: string
        description?: string
        enabled: boolean
    }

    interface ZoneWithRecords extends Zone {
        records: Record[]
    }

    type RECORD_TYPE = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'PTR' | 'SOA' | 'SRV' | 'TXT'

    interface Record {
        id: number
        zoneDomain: string
        name: string
        type: RECORD_TYPE
        content: string
        ttl: number
        priority?: number
        changeDate?: Date
        enabled: boolean
    }

    interface RecordWithZone extends Record {
        zone: Zone
    }

    interface RecordCreate extends Record {
        id?: number
    }
}

declare module '@fontsource/*';
declare module '@fontsource-variable/*';