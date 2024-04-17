"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[2894],{3905:function(e,t,r){r.d(t,{Zo:function(){return s},kt:function(){return f}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function p(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var o=n.createContext({}),c=function(e){var t=n.useContext(o),r=t;return e&&(r="function"==typeof e?e(t):p(p({},t),e)),r},s=function(e){var t=c(e.components);return n.createElement(o.Provider,{value:t},e.children)},v={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},u=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,s=l(e,["components","mdxType","originalType","parentName"]),u=c(r),f=a,m=u["".concat(o,".").concat(f)]||u[f]||v[f]||i;return r?n.createElement(m,p(p({ref:t},s),{},{components:r})):n.createElement(m,p({ref:t},s))}));function f(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,p=new Array(i);p[0]=u;var l={};for(var o in t)hasOwnProperty.call(t,o)&&(l[o]=t[o]);l.originalType=e,l.mdxType="string"==typeof e?e:a,p[1]=l;for(var c=2;c<i;c++)p[c]=r[c];return n.createElement.apply(null,p)}return n.createElement.apply(null,r)}u.displayName="MDXCreateElement"},8231:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return p},contentTitle:function(){return l},metadata:function(){return o},toc:function(){return c},default:function(){return v}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),p={id:"viewer.ViewerStateEvent",title:"Interface: ViewerStateEvent",sidebar_label:"ViewerStateEvent",custom_edit_url:null},l=void 0,o={unversionedId:"interfaces/viewer.ViewerStateEvent",id:"interfaces/viewer.ViewerStateEvent",isDocsHomePage:!1,title:"Interface: ViewerStateEvent",description:"viewer.ViewerStateEvent",source:"@site/api/interfaces/viewer.ViewerStateEvent.md",sourceDirName:"interfaces",slug:"/interfaces/viewer.ViewerStateEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerStateEvent",editUrl:null,tags:[],version:"current",frontMatter:{id:"viewer.ViewerStateEvent",title:"Interface: ViewerStateEvent",sidebar_label:"ViewerStateEvent",custom_edit_url:null},sidebar:"api",previous:{title:"ViewerReferenceEvent",permalink:"/mapillary-js/api/interfaces/viewer.ViewerReferenceEvent"}},c=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],s={toc:c};function v(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/viewer"},"viewer"),".ViewerStateEvent"),(0,i.kt)("p",null,"Interface for viewer state events."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"// The `fov` event is an example of a `ViewerStateEvent`.\n// Set up an event listener on the viewer.\nviewer.on('fov', function(e) {\n  console.log('A fov event has occured');\n});\n")),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ViewerEvent"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"ViewerStateEvent"))))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"target"},"target"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"target"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.IViewer"},(0,i.kt)("inlineCode",{parentName:"a"},"IViewer"))),(0,i.kt)("p",null,"The viewer object that fired the event."),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},"ViewerEvent"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent#target"},"target")),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/events/ViewerEvent.ts#L11"},"viewer/events/ViewerEvent.ts:11")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"type"},"type"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"type"),": ",(0,i.kt)("inlineCode",{parentName:"p"},'"fov"')," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},'"moveend"')," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},'"movestart"')," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},'"position"')," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},'"pov"')," ","|"," ",(0,i.kt)("inlineCode",{parentName:"p"},'"remove"')),(0,i.kt)("p",null,"The event type."),(0,i.kt)("h4",{id:"overrides"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent"},"ViewerEvent"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/viewer.ViewerEvent#type"},"type")),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/viewer/events/ViewerStateEvent.ts#L19"},"viewer/events/ViewerStateEvent.ts:19")))}v.isMDXComponent=!0}}]);