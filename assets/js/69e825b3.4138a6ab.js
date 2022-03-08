"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[6364],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return y}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var m=r.createContext({}),l=function(e){var t=r.useContext(m),n=t;return e&&(n="function"==typeof e?e(t):p(p({},t),e)),n},c=function(e){var t=l(e.components);return r.createElement(m.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,a=e.originalType,m=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),u=l(n),y=o,f=u["".concat(m,".").concat(y)]||u[y]||s[y]||a;return n?r.createElement(f,p(p({ref:t},c),{},{components:n})):r.createElement(f,p({ref:t},c))}));function y(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=n.length,p=new Array(a);p[0]=u;var i={};for(var m in t)hasOwnProperty.call(t,m)&&(i[m]=t[m]);i.originalType=e,i.mdxType="string"==typeof e?e:o,p[1]=i;for(var l=2;l<a;l++)p[l]=n[l];return r.createElement.apply(null,p)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},5683:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return p},contentTitle:function(){return i},metadata:function(){return m},toc:function(){return l},default:function(){return s}});var r=n(2122),o=n(9756),a=(n(7294),n(3905)),p={id:"component.ComponentGeometryEvent",title:"Interface: ComponentGeometryEvent",sidebar_label:"ComponentGeometryEvent",custom_edit_url:null},i=void 0,m={unversionedId:"interfaces/component.ComponentGeometryEvent",id:"interfaces/component.ComponentGeometryEvent",isDocsHomePage:!1,title:"Interface: ComponentGeometryEvent",description:"component.ComponentGeometryEvent",source:"@site/api/interfaces/component.ComponentGeometryEvent.md",sourceDirName:"interfaces",slug:"/interfaces/component.ComponentGeometryEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentGeometryEvent",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.ComponentGeometryEvent",title:"Interface: ComponentGeometryEvent",sidebar_label:"ComponentGeometryEvent",custom_edit_url:null},sidebar:"api",previous:{title:"ComponentEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentEvent"},next:{title:"ComponentHoverEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentHoverEvent"}},l=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"geometry",id:"geometry",children:[]},{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],c={toc:l};function s(e){var t=e.components,n=(0,o.Z)(e,["components"]);return(0,a.kt)("wrapper",(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".ComponentGeometryEvent"),(0,a.kt)("p",null,"Interface for component geometry events."),(0,a.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},(0,a.kt)("inlineCode",{parentName:"a"},"ComponentEvent"))),(0,a.kt)("p",{parentName:"li"},"\u21b3 ",(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("inlineCode",{parentName:"strong"},"ComponentGeometryEvent"))))),(0,a.kt)("h2",{id:"properties"},"Properties"),(0,a.kt)("h3",{id:"geometry"},"geometry"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"geometry"),": ",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/component.Geometry"},(0,a.kt)("inlineCode",{parentName:"a"},"Geometry"))),(0,a.kt)("p",null,"Geometry related to the event."),(0,a.kt)("h4",{id:"defined-in"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/events/ComponentGeometryEvent.ts#L11"},"component/events/ComponentGeometryEvent.ts:11")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"target"},"target"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"target"),": ",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.IComponent"},(0,a.kt)("inlineCode",{parentName:"a"},"IComponent"))),(0,a.kt)("p",null,"The component object that fired the event."),(0,a.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},"ComponentEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent#target"},"target")),(0,a.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/events/ComponentEvent.ts#L11"},"component/events/ComponentEvent.ts:11")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"type"},"type"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"type"),": ",(0,a.kt)("inlineCode",{parentName:"p"},'"geometrycreate"')),(0,a.kt)("p",null,"The event type."),(0,a.kt)("h4",{id:"overrides"},"Overrides"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},"ComponentEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent#type"},"type")),(0,a.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/events/ComponentGeometryEvent.ts#L13"},"component/events/ComponentGeometryEvent.ts:13")))}s.isMDXComponent=!0}}]);