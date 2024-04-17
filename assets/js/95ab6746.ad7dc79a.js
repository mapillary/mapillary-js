"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[7557],{3905:function(e,t,n){n.d(t,{Zo:function(){return d},kt:function(){return c}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),m=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):p(p({},t),e)),n},d=function(e){var t=m(e.components);return a.createElement(l.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},k=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,l=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),k=m(n),c=r,u=k["".concat(l,".").concat(c)]||k[c]||s[c]||o;return n?a.createElement(u,p(p({ref:t},d),{},{components:n})):a.createElement(u,p({ref:t},d))}));function c(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,p=new Array(o);p[0]=k;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:r,p[1]=i;for(var m=2;m<o;m++)p[m]=n[m];return a.createElement.apply(null,p)}return a.createElement.apply(null,n)}k.displayName="MDXCreateElement"},3248:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return p},contentTitle:function(){return i},metadata:function(){return l},toc:function(){return m},default:function(){return s}});var a=n(2122),r=n(9756),o=(n(7294),n(3905)),p={id:"component.ZoomComponent",title:"Class: ZoomComponent",sidebar_label:"ZoomComponent",custom_edit_url:null},i=void 0,l={unversionedId:"classes/component.ZoomComponent",id:"classes/component.ZoomComponent",isDocsHomePage:!1,title:"Class: ZoomComponent",description:"component.ZoomComponent",source:"@site/api/classes/component.ZoomComponent.md",sourceDirName:"classes",slug:"/classes/component.ZoomComponent",permalink:"/mapillary-js/api/classes/component.ZoomComponent",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.ZoomComponent",title:"Class: ZoomComponent",sidebar_label:"ZoomComponent",custom_edit_url:null},sidebar:"api",previous:{title:"VertexGeometry",permalink:"/mapillary-js/api/classes/component.VertexGeometry"},next:{title:"ArgumentMapillaryError",permalink:"/mapillary-js/api/classes/viewer.ArgumentMapillaryError"}},m=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Constructors",id:"constructors",children:[{value:"constructor",id:"constructor",children:[]}]},{value:"Properties",id:"properties",children:[{value:"componentName",id:"componentname",children:[]}]},{value:"Accessors",id:"accessors",children:[{value:"activated",id:"activated",children:[]},{value:"defaultConfiguration",id:"defaultconfiguration",children:[]},{value:"name",id:"name",children:[]}]},{value:"Methods",id:"methods",children:[{value:"configure",id:"configure",children:[]},{value:"fire",id:"fire",children:[]},{value:"off",id:"off",children:[]},{value:"on",id:"on",children:[]}]}],d={toc:m};function s(e){var t=e.components,n=(0,r.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".ZoomComponent"),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"classdesc"))," Component rendering UI elements used for zooming."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"example"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},'var viewer = new Viewer({ ... });\n\nvar zoomComponent = viewer.getComponent("zoom");\nzoomComponent.configure({ size: ComponentSize.Small });\n')),(0,o.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},(0,o.kt)("inlineCode",{parentName:"a"},"Component")),"<",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ZoomConfiguration"},(0,o.kt)("inlineCode",{parentName:"a"},"ZoomConfiguration")),">"),(0,o.kt)("p",{parentName:"li"},"\u21b3 ",(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"ZoomComponent"))))),(0,o.kt)("h2",{id:"constructors"},"Constructors"),(0,o.kt)("h3",{id:"constructor"},"constructor"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"new ZoomComponent"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"name"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"container"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"navigator"),")"),(0,o.kt)("h4",{id:"parameters"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"name")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"string"))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"container")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"Container"))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"navigator")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"Navigator"))))),(0,o.kt)("h4",{id:"overrides"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#constructor"},"constructor")),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/zoom/ZoomComponent.ts#L49"},"component/zoom/ZoomComponent.ts:49")),(0,o.kt)("h2",{id:"properties"},"Properties"),(0,o.kt)("h3",{id:"componentname"},"componentName"),(0,o.kt)("p",null,"\u25aa ",(0,o.kt)("inlineCode",{parentName:"p"},"Static")," ",(0,o.kt)("strong",{parentName:"p"},"componentName"),": ",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component#componentname"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentName"))," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"zoom"')),(0,o.kt)("h4",{id:"overrides-1"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#componentname"},"componentName")),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/zoom/ZoomComponent.ts#L43"},"component/zoom/ZoomComponent.ts:43")),(0,o.kt)("h2",{id:"accessors"},"Accessors"),(0,o.kt)("h3",{id:"activated"},"activated"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"activated"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Get activated."),(0,o.kt)("h4",{id:"returns"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Value indicating if the component is\ncurrently active."),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L78"},"component/Component.ts:78")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"defaultconfiguration"},"defaultConfiguration"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"defaultConfiguration"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"TConfiguration")),(0,o.kt)("p",null,"Get default configuration."),(0,o.kt)("h4",{id:"returns-1"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"TConfiguration")),(0,o.kt)("p",null,"Default configuration for component."),(0,o.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L92"},"component/Component.ts:92")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"name"},"name"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"name"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("p",null,"Get name."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"description"))," The name of the component. Used when interacting with the\ncomponent through the Viewer's API."),(0,o.kt)("h4",{id:"returns-2"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L107"},"component/Component.ts:107")),(0,o.kt)("h2",{id:"methods"},"Methods"),(0,o.kt)("h3",{id:"configure"},"configure"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"configure"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"configuration"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Configure the component."),(0,o.kt)("h4",{id:"parameters-1"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"configuration")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.ZoomConfiguration"},(0,o.kt)("inlineCode",{parentName:"a"},"ZoomConfiguration"))),(0,o.kt)("td",{parentName:"tr",align:"left"},"Component configuration.")))),(0,o.kt)("h4",{id:"returns-3"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#configure"},"configure")),(0,o.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L131"},"component/Component.ts:131")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"fire"},"fire"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"fire"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"T"),">","(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"event"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"type-parameters"},"Type parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"T"))))),(0,o.kt)("h4",{id:"parameters-2"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/modules/component#componenteventtype"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentEventType")))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"event")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"T"))))),(0,o.kt)("h4",{id:"returns-4"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#fire"},"fire")),(0,o.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L149"},"component/Component.ts:149")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"off"},"off"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"off"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"T"),">","(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Unsubscribe from an event by its name."),(0,o.kt)("h4",{id:"type-parameters-1"},"Type parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"T"))))),(0,o.kt)("h4",{id:"parameters-3"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/modules/component#componenteventtype"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentEventType"))),(0,o.kt)("td",{parentName:"tr",align:"left"},"The name of the event to unsubscribe from.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"handler")),(0,o.kt)("td",{parentName:"tr",align:"left"},"(",(0,o.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,o.kt)("inlineCode",{parentName:"td"},"T"),") => ",(0,o.kt)("inlineCode",{parentName:"td"},"void")),(0,o.kt)("td",{parentName:"tr",align:"left"},"The handler to remove.")))),(0,o.kt)("h4",{id:"returns-5"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from-2"},"Inherited from"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#off"},"off")),(0,o.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L156"},"component/Component.ts:156")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"on"},"on"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"on"),"<",(0,o.kt)("inlineCode",{parentName:"p"},"T"),">","(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Subscribe to an event by its name."),(0,o.kt)("h4",{id:"type-parameters-2"},"Type parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"T"))))),(0,o.kt)("h4",{id:"parameters-4"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/modules/component#componenteventtype"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentEventType"))),(0,o.kt)("td",{parentName:"tr",align:"left"},"The name of the event to subscribe to.")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"handler")),(0,o.kt)("td",{parentName:"tr",align:"left"},"(",(0,o.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,o.kt)("inlineCode",{parentName:"td"},"T"),") => ",(0,o.kt)("inlineCode",{parentName:"td"},"void")),(0,o.kt)("td",{parentName:"tr",align:"left"},"The handler called when the event occurs.")))),(0,o.kt)("h4",{id:"returns-6"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from-3"},"Inherited from"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#on"},"on")),(0,o.kt)("h4",{id:"defined-in-8"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/Component.ts#L163"},"component/Component.ts:163")))}s.isMDXComponent=!0}}]);