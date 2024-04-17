"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[2751],{3905:function(e,t,r){r.d(t,{Zo:function(){return m},kt:function(){return v}});var n=r(7294);function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){i(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function p(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}var o=n.createContext({}),c=function(e){var t=n.useContext(o),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},m=function(e){var t=c(e.components);return n.createElement(o.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var r=e.components,i=e.mdxType,a=e.originalType,o=e.parentName,m=p(e,["components","mdxType","originalType","parentName"]),u=c(r),v=i,f=u["".concat(o,".").concat(v)]||u[v]||s[v]||a;return r?n.createElement(f,l(l({ref:t},m),{},{components:r})):n.createElement(f,l({ref:t},m))}));function v(e,t){var r=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=r.length,l=new Array(a);l[0]=u;var p={};for(var o in t)hasOwnProperty.call(t,o)&&(p[o]=t[o]);p.originalType=e,p.mdxType="string"==typeof e?e:i,l[1]=p;for(var c=2;c<a;c++)l[c]=r[c];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}u.displayName="MDXCreateElement"},3994:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return l},contentTitle:function(){return p},metadata:function(){return o},toc:function(){return c},default:function(){return s}});var n=r(2122),i=r(9756),a=(r(7294),r(3905)),l={id:"viewer.ViewerImageEvent",title:"Interface: ViewerImageEvent",sidebar_label:"ViewerImageEvent",custom_edit_url:null},p=void 0,o={unversionedId:"interfaces/viewer.ViewerImageEvent",id:"interfaces/viewer.ViewerImageEvent",isDocsHomePage:!1,title:"Interface: ViewerImageEvent",description:"viewer.ViewerImageEvent",source:"@site/api/interfaces/viewer.ViewerImageEvent.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.ViewerImageEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerImageEvent",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.ViewerImageEvent",title:"Interface: ViewerImageEvent",sidebar_label:"ViewerImageEvent",custom_edit_url:null},sidebar:"api",previous:{title:"ViewerEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},next:{title:"ViewerMouseEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerMouseEvent"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"image",id:"image",children:[]},{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],m={toc:c};function s(e){var t=e.components,r=(0,i.Z)(e,["components"]);return(0,a.kt)("wrapper",(0,n.Z)({},m,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".ViewerImageEvent"),(0,a.kt)("p",null,"Interface for viewer image events."),(0,a.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},(0,a.kt)("inlineCode",{parentName:"a"},"ViewerEvent"))),(0,a.kt)("p",{parentName:"li"},"\u21b3 ",(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("inlineCode",{parentName:"strong"},"ViewerImageEvent"))))),(0,a.kt)("h2",{id:"properties"},"Properties"),(0,a.kt)("h3",{id:"image"},"image"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"image"),": ",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/viewer.Image"},(0,a.kt)("inlineCode",{parentName:"a"},"Image"))),(0,a.kt)("p",null,"The viewer's current image."),(0,a.kt)("h4",{id:"defined-in"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/events/ViewerImageEvent.ts#L11"},"viewer/events/ViewerImageEvent.ts:11")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"target"},"target"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"target"),": ",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.IViewer"},(0,a.kt)("inlineCode",{parentName:"a"},"IViewer"))),(0,a.kt)("p",null,"The viewer object that fired the event."),(0,a.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},"ViewerEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent#target"},"target")),(0,a.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/events/ViewerEvent.ts#L11"},"viewer/events/ViewerEvent.ts:11")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"type"},"type"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"type"),": ",(0,a.kt)("inlineCode",{parentName:"p"},'"image"')),(0,a.kt)("p",null,"The event type."),(0,a.kt)("h4",{id:"overrides"},"Overrides"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},"ViewerEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent#type"},"type")),(0,a.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/events/ViewerImageEvent.ts#L13"},"viewer/events/ViewerImageEvent.ts:13")))}s.isMDXComponent=!0}}]);