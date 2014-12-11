 module SiteTesterTypes {



    export enum MetricType {
        javascript_Error,
        not_found
    }

    export class MetricData {


        private type: MetricType;

        constructor(type : MetricType) {
            this.type = type;
        }

        getCssClass() {
            return (this.type == MetricType.javascript_Error ? '.jserror' :
                   (this.type == MetricType.not_found) ? '.notfound' : '');
        }

    }

    export interface SiteTesterSettings {
        urls: string[];
        screenshot: boolean;
        cron : string;
    }


     export interface DomainWithTests {
         domain: string;
         tests: any[];
     }


    export class TestHistory  {

        private testDate: string;
        private tests : TestInstance[];

        constructor(date, tests) {
            this.testDate = date;
            this.tests = tests;
        }

        getDate() {
            return this.testDate;
        }

        getTests() {
            return this.tests;
        }

    }


    export class TestInstance {
        private offenders  : any;
        private metrics : any;
        private url : string;
        private screen : string;

        constructor(offenders, metrics, url, screen) {
            this.offenders = offenders;
            this.metrics = metrics;
            this.url = url;
            this.screen = screen;
        }

        getData() {
            return {url : this.url, metrics : this.metrics, offenders : this.offenders};
        }

    }




}
