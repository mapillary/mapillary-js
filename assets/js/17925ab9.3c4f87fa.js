"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[1704],{3905:function(e,n,t){t.d(n,{Zo:function(){return m},kt:function(){return k}});var i=t(7294);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function r(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);n&&(i=i.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,i)}return t}function o(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?r(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):r(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function p(e,n){if(null==e)return{};var t,i,a=function(e,n){if(null==e)return{};var t,i,a={},r=Object.keys(e);for(i=0;i<r.length;i++)t=r[i],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(i=0;i<r.length;i++)t=r[i],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var l=i.createContext({}),s=function(e){var n=i.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):o(o({},n),e)),t},m=function(e){var n=s(e.components);return i.createElement(l.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return i.createElement(i.Fragment,{},n)}},d=i.forwardRef((function(e,n){var t=e.components,a=e.mdxType,r=e.originalType,l=e.parentName,m=p(e,["components","mdxType","originalType","parentName"]),d=s(t),k=a,c=d["".concat(l,".").concat(k)]||d[k]||u[k]||r;return t?i.createElement(c,o(o({ref:n},m),{},{components:t})):i.createElement(c,o({ref:n},m))}));function k(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var r=t.length,o=new Array(r);o[0]=d;var p={};for(var l in n)hasOwnProperty.call(n,l)&&(p[l]=n[l]);p.originalType=e,p.mdxType="string"==typeof e?e:a,o[1]=p;for(var s=2;s<r;s++)o[s]=t[s];return i.createElement.apply(null,o)}return i.createElement.apply(null,t)}d.displayName="MDXCreateElement"},8419:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return o},contentTitle:function(){return p},metadata:function(){return l},toc:function(){return s},default:function(){return u}});var i=t(2122),a=t(9756),r=(t(7294),t(3905)),o={id:"viewer.ComponentOptions",title:"Interface: ComponentOptions",sidebar_label:"ComponentOptions",custom_edit_url:null},p=void 0,l={unversionedId:"interfaces/viewer.ComponentOptions",id:"interfaces/viewer.ComponentOptions",isDocsHomePage:!1,title:"Interface: ComponentOptions",description:"viewer.ComponentOptions",source:"@site/api/interfaces/viewer.ComponentOptions.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.ComponentOptions",permalink:"/mapillary-js/api/interfaces/viewer.ComponentOptions",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.ComponentOptions",title:"Interface: ComponentOptions",sidebar_label:"ComponentOptions",custom_edit_url:null},sidebar:"api",previous:{title:"ZoomConfiguration",permalink:"/mapillary-js/api/interfaces/component.ZoomConfiguration"},next:{title:"FallbackOptions",permalink:"/mapillary-js/api/interfaces/viewer.FallbackOptions"}},s=[{value:"Properties",id:"properties",children:[{value:"attribution",id:"attribution",children:[]},{value:"bearing",id:"bearing",children:[]},{value:"cache",id:"cache",children:[]},{value:"cover",id:"cover",children:[]},{value:"direction",id:"direction",children:[]},{value:"fallback",id:"fallback",children:[]},{value:"image",id:"image",children:[]},{value:"keyboard",id:"keyboard",children:[]},{value:"marker",id:"marker",children:[]},{value:"pointer",id:"pointer",children:[]},{value:"popup",id:"popup",children:[]},{value:"sequence",id:"sequence",children:[]},{value:"slider",id:"slider",children:[]},{value:"spatial",id:"spatial",children:[]},{value:"tag",id:"tag",children:[]},{value:"zoom",id:"zoom",children:[]}]}],m={toc:s};function u(e){var n=e.components,t=(0,a.Z)(e,["components"]);return(0,r.kt)("wrapper",(0,i.Z)({},m,t,{components:n,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".ComponentOptions"),(0,r.kt)("p",null,"Interface for the component options that can be provided to the viewer."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,r.kt)("h2",{id:"properties"},"Properties"),(0,r.kt)("h3",{id:"attribution"},"attribution"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"attribution"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Show attribution."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L25"},"viewer/options/ComponentOptions.ts:25")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"bearing"},"bearing"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"bearing"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.BearingConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"BearingConfiguration"))),(0,r.kt)("p",null,"Show indicator for bearing and field of view."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L32"},"viewer/options/ComponentOptions.ts:32")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"cache"},"cache"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"cache"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.CacheConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"CacheConfiguration"))),(0,r.kt)("p",null,"Cache images around the current one."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L39"},"viewer/options/ComponentOptions.ts:39")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"cover"},"cover"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"cover"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Use a cover to avoid loading data until viewer interaction."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L46"},"viewer/options/ComponentOptions.ts:46")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"direction"},"direction"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"direction"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.DirectionConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"DirectionConfiguration"))),(0,r.kt)("p",null,"Show spatial direction arrows for navigation."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Default spatial navigation when there is WebGL support.\nRequires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L56"},"viewer/options/ComponentOptions.ts:56")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"fallback"},"fallback"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"fallback"),": ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.FallbackOptions"},(0,r.kt)("inlineCode",{parentName:"a"},"FallbackOptions"))),(0,r.kt)("p",null,"Enable fallback component options\nwhen the browser does not have WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," undefined"),(0,r.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L64"},"viewer/options/ComponentOptions.ts:64")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"image"},"image"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"image"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Show image planes in 3D."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L73"},"viewer/options/ComponentOptions.ts:73")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"keyboard"},"keyboard"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"keyboard"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.KeyboardConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"KeyboardConfiguration"))),(0,r.kt)("p",null,"Enable use of keyboard commands."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L82"},"viewer/options/ComponentOptions.ts:82")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"marker"},"marker"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"marker"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.MarkerConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"MarkerConfiguration"))),(0,r.kt)("p",null,"Enable an interface for showing 3D markers in the viewer."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-8"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L91"},"viewer/options/ComponentOptions.ts:91")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"pointer"},"pointer"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"pointer"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.PointerConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"PointerConfiguration"))),(0,r.kt)("p",null,"Enable mouse, pen, and touch interaction for zoom and pan."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-9"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L100"},"viewer/options/ComponentOptions.ts:100")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"popup"},"popup"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"popup"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Show HTML popups over images."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-10"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L109"},"viewer/options/ComponentOptions.ts:109")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"sequence"},"sequence"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"sequence"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.SequenceConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"SequenceConfiguration"))),(0,r.kt)("p",null,"Show sequence related navigation."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Default sequence navigation when there is WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-11"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L118"},"viewer/options/ComponentOptions.ts:118")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"slider"},"slider"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"slider"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.SliderConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"SliderConfiguration"))),(0,r.kt)("p",null,"Show a slider for transitioning between image planes."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-12"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L127"},"viewer/options/ComponentOptions.ts:127")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"spatial"},"spatial"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"spatial"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.SpatialConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"SpatialConfiguration"))),(0,r.kt)("p",null,"Enable an interface for showing spatial data in the viewer."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-13"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L136"},"viewer/options/ComponentOptions.ts:136")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"tag"},"tag"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"tag"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.TagConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"TagConfiguration"))),(0,r.kt)("p",null,"Enable an interface for drawing 2D geometries on top of images."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-14"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L145"},"viewer/options/ComponentOptions.ts:145")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"zoom"},"zoom"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"zoom"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")," ","|"," ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ZoomConfiguration"},(0,r.kt)("inlineCode",{parentName:"a"},"ZoomConfiguration"))),(0,r.kt)("p",null,"Show buttons for zooming in and out."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Requires WebGL support."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-15"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/viewer/options/ComponentOptions.ts#L154"},"viewer/options/ComponentOptions.ts:154")))}u.isMDXComponent=!0}}]);