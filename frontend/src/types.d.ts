declare namespace Types {
    interface BaseUser {
        id: number
        username: string
        email?: string
        name: string
        isApi: boolean
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

    interface ZoneWithRecords extends Zone {
        records: Record[]
    }

    type RecordDirectionType = 'FORWARD' | 'REVERSE'

    type RECORD_TYPE = 'A' | 'AAAA' | 'CNAME' | 'MX'  | 'NS' | 'PTR' | 'SOA' | 'SPF' | 'SRV' | 'TXT'

    interface Record {
        zoneDomain: string
        direction: FORWARD | REVERSE
        name: string
        type: RECORD_TYPE
        content: string
        ttl: number
        priority?: number
        changeDate: Date
        enabled: boolean
    }

    interface RecordWithZone extends Record {
        zone: Zone
    }
}

declare module '@fontsource/*';
declare module '@fontsource-variable/*';