"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[2167],{3905:function(e,t,r){r.d(t,{Zo:function(){return d},kt:function(){return u}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function p(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var o=n.createContext({}),c=function(e){var t=n.useContext(o),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},d=function(e){var t=c(e.components);return n.createElement(o.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},v=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,d=p(e,["components","mdxType","originalType","parentName"]),v=c(r),u=a,f=v["".concat(o,".").concat(u)]||v[u]||s[u]||i;return r?n.createElement(f,l(l({ref:t},d),{},{components:r})):n.createElement(f,l({ref:t},d))}));function u(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,l=new Array(i);l[0]=v;var p={};for(var o in t)hasOwnProperty.call(t,o)&&(p[o]=t[o]);p.originalType=e,p.mdxType="string"==typeof e?e:a,l[1]=p;for(var c=2;c<i;c++)l[c]=r[c];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}v.displayName="MDXCreateElement"},5441:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return l},contentTitle:function(){return p},metadata:function(){return o},toc:function(){return c},default:function(){return s}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),l={id:"api.ProviderCellEvent",title:"Interface: ProviderCellEvent",sidebar_label:"ProviderCellEvent",custom_edit_url:null},p=void 0,o={unversionedId:"interfaces/api.ProviderCellEvent",id:"interfaces/api.ProviderCellEvent",isDocsHomePage:!1,title:"Interface: ProviderCellEvent",description:"api.ProviderCellEvent",source:"@site/api/interfaces/api.ProviderCellEvent.md",sourceDirName:"interfaces",slug:"/interfaces/api.ProviderCellEvent",permalink:"/mapillary-js/api/interfaces/api.ProviderCellEvent",editUrl:null,version:"current",frontMatter:{id:"api.ProviderCellEvent",title:"Interface: ProviderCellEvent",sidebar_label:"ProviderCellEvent",custom_edit_url:null},sidebar:"api",previous:{title:"PointContract",permalink:"/mapillary-js/api/interfaces/api.PointContract"},next:{title:"ProviderEvent",permalink:"/mapillary-js/api/interfaces/api.ProviderEvent"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"cellIds",id:"cellids",children:[]},{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],d={toc:c};function s(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},d,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".ProviderCellEvent"),(0,i.kt)("p",null,"Interface for data provider cell events."),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ProviderEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ProviderEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"ProviderCellEvent"))))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"cellids"},"cellIds"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"cellIds"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string"),"[]"),(0,i.kt)("p",null,"Cell ids for cells where data have been created."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/events/ProviderCellEvent.ts#L11"},"api/events/ProviderCellEvent.ts:11")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"target"},"target"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"target"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},(0,i.kt)("inlineCode",{parentName:"a"},"DataProviderBase"))),(0,i.kt)("p",null,"Data provider target that emitted the event."),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ProviderEvent"},"ProviderEvent"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ProviderEvent#target"},"target")),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/events/ProviderEvent.ts#L11"},"api/events/ProviderEvent.ts:11")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"type"},"type"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"type"),": ",(0,i.kt)("inlineCode",{parentName:"p"},'"datacreate"')),(0,i.kt)("p",null,"Provider event type."),(0,i.kt)("h4",{id:"overrides"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ProviderEvent"},"ProviderEvent"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ProviderEvent#type"},"type")),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/events/ProviderCellEvent.ts#L16"},"api/events/ProviderCellEvent.ts:16")))}s.isMDXComponent=!0}}]);