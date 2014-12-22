/// <reference path="../../typings/knockout/knockout.d.ts"/>

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
        urls: SavePageModel[];
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
        private url : any;
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


     export class SavePageModel {
         public url : KnockoutObservable<string>;
         public screenshot : KnockoutObservable<boolean>;
         public active : KnockoutObservable<boolean>;

         constructor(data : any) {


             this.url = ko.observable(data.url);
             this.screenshot =ko.observable(data.screenshot);
             this.active = ko.observable(data.active);
         }

         canSave() {
             var pattern = /^(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
             return pattern.test(this.url()) ;

         }

     }




}
