"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[1041],{3905:function(e,t,r){r.d(t,{Zo:function(){return v},kt:function(){return u}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function p(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var o=n.createContext({}),c=function(e){var t=n.useContext(o),r=t;return e&&(r="function"==typeof e?e(t):p(p({},t),e)),r},v=function(e){var t=c(e.components);return n.createElement(o.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,v=l(e,["components","mdxType","originalType","parentName"]),m=c(r),u=a,f=m["".concat(o,".").concat(u)]||m[u]||s[u]||i;return r?n.createElement(f,p(p({ref:t},v),{},{components:r})):n.createElement(f,p({ref:t},v))}));function u(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,p=new Array(i);p[0]=m;var l={};for(var o in t)hasOwnProperty.call(t,o)&&(l[o]=t[o]);l.originalType=e,l.mdxType="string"==typeof e?e:a,p[1]=l;for(var c=2;c<i;c++)p[c]=r[c];return n.createElement.apply(null,p)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},2012:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return p},contentTitle:function(){return l},metadata:function(){return o},toc:function(){return c},default:function(){return s}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),p={id:"viewer.ViewerEvent",title:"Interface: ViewerEvent",sidebar_label:"ViewerEvent",custom_edit_url:null},l=void 0,o={unversionedId:"interfaces/viewer.ViewerEvent",id:"interfaces/viewer.ViewerEvent",isDocsHomePage:!1,title:"Interface: ViewerEvent",description:"viewer.ViewerEvent",source:"@site/api/interfaces/viewer.ViewerEvent.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.ViewerEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerEvent",editUrl:null,version:"current",frontMatter:{id:"viewer.ViewerEvent",title:"Interface: ViewerEvent",sidebar_label:"ViewerEvent",custom_edit_url:null},sidebar:"api",previous:{title:"ViewerDataLoadingEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerDataLoadingEvent"},next:{title:"ViewerImageEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerImageEvent"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],v={toc:c};function s(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},v,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".ViewerEvent"),(0,i.kt)("p",null,"Interface for general viewer events."),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"ViewerEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerBearingEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerBearingEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerImageEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerImageEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerDataLoadingEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerDataLoadingEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerMouseEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerMouseEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerNavigableEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerNavigableEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerNavigationEdgeEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerNavigationEdgeEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerStateEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerStateEvent"))))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"target"},"target"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"target"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.IViewer"},(0,i.kt)("inlineCode",{parentName:"a"},"IViewer"))),(0,i.kt)("p",null,"The viewer object that fired the event."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/viewer/events/ViewerEvent.ts#L11"},"viewer/events/ViewerEvent.ts:11")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"type"},"type"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"type"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer#viewereventtype"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerEventType"))),(0,i.kt)("p",null,"The event type."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/viewer/events/ViewerEvent.ts#L16"},"viewer/events/ViewerEvent.ts:16")))}s.isMDXComponent=!0}}]);