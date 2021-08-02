"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[2260],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return k}});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var l=a.createContext({}),m=function(e){var t=a.useContext(l),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},c=function(e){var t=m(e.components);return a.createElement(l.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},s=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,l=e.parentName,c=p(e,["components","mdxType","originalType","parentName"]),s=m(n),k=r,u=s["".concat(l,".").concat(k)]||s[k]||d[k]||o;return n?a.createElement(u,i(i({ref:t},c),{},{components:n})):a.createElement(u,i({ref:t},c))}));function k(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,i=new Array(o);i[0]=s;var p={};for(var l in t)hasOwnProperty.call(t,l)&&(p[l]=t[l]);p.originalType=e,p.mdxType="string"==typeof e?e:r,i[1]=p;for(var m=2;m<o;m++)i[m]=n[m];return a.createElement.apply(null,i)}return a.createElement.apply(null,n)}s.displayName="MDXCreateElement"},3820:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return i},contentTitle:function(){return p},metadata:function(){return l},toc:function(){return m},default:function(){return d}});var a=n(2122),r=n(9756),o=(n(7294),n(3905)),i={id:"component.DirectionComponent",title:"Class: DirectionComponent",sidebar_label:"DirectionComponent",custom_edit_url:null},p=void 0,l={unversionedId:"classes/component.DirectionComponent",id:"classes/component.DirectionComponent",isDocsHomePage:!1,title:"Class: DirectionComponent",description:"component.DirectionComponent",source:"@site/api/classes/component.DirectionComponent.md",sourceDirName:"classes",slug:"/classes/component.DirectionComponent",permalink:"/mapillary-js/api/classes/component.DirectionComponent",editUrl:null,version:"current",frontMatter:{id:"component.DirectionComponent",title:"Class: DirectionComponent",sidebar_label:"DirectionComponent",custom_edit_url:null},sidebar:"api",previous:{title:"Component",permalink:"/mapillary-js/api/classes/component.Component"},next:{title:"DragPanHandler",permalink:"/mapillary-js/api/classes/component.DragPanHandler"}},m=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Events",id:"events",children:[{value:"on",id:"on",children:[]}]},{value:"Properties",id:"properties",children:[{value:"componentName",id:"componentname",children:[]}]},{value:"Accessors",id:"accessors",children:[{value:"activated",id:"activated",children:[]},{value:"defaultConfiguration",id:"defaultconfiguration",children:[]},{value:"name",id:"name",children:[]}]},{value:"Methods",id:"methods",children:[{value:"configure",id:"configure",children:[]},{value:"fire",id:"fire",children:[]},{value:"off",id:"off",children:[]}]}],c={toc:m};function d(e){var t=e.components,n=(0,r.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".DirectionComponent"),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"classdesc"))," Component showing navigation arrows for steps and turns."),(0,o.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("p",{parentName:"li"},(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},(0,o.kt)("inlineCode",{parentName:"a"},"Component")),"<",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.DirectionConfiguration"},(0,o.kt)("inlineCode",{parentName:"a"},"DirectionConfiguration")),">"),(0,o.kt)("p",{parentName:"li"},"\u21b3 ",(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"DirectionComponent"))))),(0,o.kt)("h2",{id:"events"},"Events"),(0,o.kt)("h3",{id:"on"},"on"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"on"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Fired when the hovered element of a component changes."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"example"))),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-js"},"// Initialize the viewer\nvar viewer = new Viewer({ // viewer options });\nvar component = viewer.getComponent('<component-name>');\n// Set an event listener\ncomponent.on('hover', function() {\n  console.log(\"A hover event has occurred.\");\n});\n")),(0,o.kt)("h4",{id:"parameters"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},'"hover"'))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"handler")),(0,o.kt)("td",{parentName:"tr",align:"left"},"(",(0,o.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.ComponentHoverEvent"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentHoverEvent")),") => ",(0,o.kt)("inlineCode",{parentName:"td"},"void"))))),(0,o.kt)("h4",{id:"returns"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"overrides"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#on"},"on")),(0,o.kt)("h4",{id:"defined-in"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/direction/DirectionComponent.ts#L115"},"component/direction/DirectionComponent.ts:115")),(0,o.kt)("h2",{id:"properties"},"Properties"),(0,o.kt)("h3",{id:"componentname"},"componentName"),(0,o.kt)("p",null,"\u25aa ",(0,o.kt)("inlineCode",{parentName:"p"},"Static")," ",(0,o.kt)("strong",{parentName:"p"},"componentName"),": ",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component#componentname"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentName"))," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"direction"')),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"inheritdoc"))),(0,o.kt)("h4",{id:"overrides-1"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#componentname"},"componentName")),(0,o.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/direction/DirectionComponent.ts#L43"},"component/direction/DirectionComponent.ts:43")),(0,o.kt)("h2",{id:"accessors"},"Accessors"),(0,o.kt)("h3",{id:"activated"},"activated"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"activated"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Get activated."),(0,o.kt)("h4",{id:"returns-1"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"boolean")),(0,o.kt)("p",null,"Value indicating if the component is\ncurrently active."),(0,o.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/Component.ts#L78"},"component/Component.ts:78")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"defaultconfiguration"},"defaultConfiguration"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"defaultConfiguration"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"TConfiguration")),(0,o.kt)("p",null,"Get default configuration."),(0,o.kt)("h4",{id:"returns-2"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"TConfiguration")),(0,o.kt)("p",null,"Default configuration for component."),(0,o.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/Component.ts#L92"},"component/Component.ts:92")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"name"},"name"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("inlineCode",{parentName:"p"},"get")," ",(0,o.kt)("strong",{parentName:"p"},"name"),"(): ",(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("p",null,"Get name."),(0,o.kt)("p",null,(0,o.kt)("strong",{parentName:"p"},(0,o.kt)("inlineCode",{parentName:"strong"},"description"))," The name of the component. Used when interacting with the\ncomponent through the Viewer's API."),(0,o.kt)("h4",{id:"returns-3"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"string")),(0,o.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/Component.ts#L107"},"component/Component.ts:107")),(0,o.kt)("h2",{id:"methods"},"Methods"),(0,o.kt)("h3",{id:"configure"},"configure"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"configure"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"configuration"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("p",null,"Configure the component."),(0,o.kt)("h4",{id:"parameters-1"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"configuration")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.DirectionConfiguration"},(0,o.kt)("inlineCode",{parentName:"a"},"DirectionConfiguration"))),(0,o.kt)("td",{parentName:"tr",align:"left"},"Component configuration.")))),(0,o.kt)("h4",{id:"returns-4"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#configure"},"configure")),(0,o.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/Component.ts#L131"},"component/Component.ts:131")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"fire"},"fire"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"fire"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"event"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"parameters-2"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},'"hover"'))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"event")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.ComponentHoverEvent"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentHoverEvent")))))),(0,o.kt)("h4",{id:"returns-5"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"overrides-2"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#fire"},"fire")),(0,o.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/direction/DirectionComponent.ts#L70"},"../doc/component/direction/DirectionComponent.ts:70")),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"off"},"off"),(0,o.kt)("p",null,"\u25b8 ",(0,o.kt)("strong",{parentName:"p"},"off"),"(",(0,o.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"parameters-3"},"Parameters"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,o.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"type")),(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},'"hover"'))),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:"left"},(0,o.kt)("inlineCode",{parentName:"td"},"handler")),(0,o.kt)("td",{parentName:"tr",align:"left"},"(",(0,o.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,o.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/component.ComponentHoverEvent"},(0,o.kt)("inlineCode",{parentName:"a"},"ComponentHoverEvent")),") => ",(0,o.kt)("inlineCode",{parentName:"td"},"void"))))),(0,o.kt)("h4",{id:"returns-6"},"Returns"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"void")),(0,o.kt)("h4",{id:"overrides-3"},"Overrides"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component"},"Component"),".",(0,o.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Component#off"},"off")),(0,o.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/direction/DirectionComponent.ts#L85"},"../doc/component/direction/DirectionComponent.ts:85")))}d.isMDXComponent=!0}}]);