"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[7582],{3905:function(e,n,t){t.d(n,{Zo:function(){return c},kt:function(){return f}});var r=t(7294);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function a(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function p(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?a(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):a(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function i(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)t=a[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var l=r.createContext({}),m=function(e){var n=r.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):p(p({},n),e)),t},c=function(e){var n=m(e.components);return r.createElement(l.Provider,{value:n},e.children)},s={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},u=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,a=e.originalType,l=e.parentName,c=i(e,["components","mdxType","originalType","parentName"]),u=m(t),f=o,y=u["".concat(l,".").concat(f)]||u[f]||s[f]||a;return t?r.createElement(y,p(p({ref:n},c),{},{components:t})):r.createElement(y,p({ref:n},c))}));function f(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var a=t.length,p=new Array(a);p[0]=u;var i={};for(var l in n)hasOwnProperty.call(n,l)&&(i[l]=n[l]);i.originalType=e,i.mdxType="string"==typeof e?e:o,p[1]=i;for(var m=2;m<a;m++)p[m]=t[m];return r.createElement.apply(null,p)}return r.createElement.apply(null,t)}u.displayName="MDXCreateElement"},2454:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return p},contentTitle:function(){return i},metadata:function(){return l},toc:function(){return m},default:function(){return s}});var r=t(2122),o=t(9756),a=(t(7294),t(3905)),p={id:"component.ComponentPlayEvent",title:"Interface: ComponentPlayEvent",sidebar_label:"ComponentPlayEvent",custom_edit_url:null},i=void 0,l={unversionedId:"interfaces/component.ComponentPlayEvent",id:"interfaces/component.ComponentPlayEvent",isDocsHomePage:!1,title:"Interface: ComponentPlayEvent",description:"component.ComponentPlayEvent",source:"@site/api/interfaces/component.ComponentPlayEvent.md",sourceDirName:"interfaces",slug:"/interfaces/component.ComponentPlayEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentPlayEvent",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.ComponentPlayEvent",title:"Interface: ComponentPlayEvent",sidebar_label:"ComponentPlayEvent",custom_edit_url:null},sidebar:"api",previous:{title:"ComponentMarkerEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentMarkerEvent"},next:{title:"ComponentStateEvent",permalink:"/mapillary-js/api/interfaces/component.ComponentStateEvent"}},m=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"playing",id:"playing",children:[]},{value:"target",id:"target",children:[]},{value:"type",id:"type",children:[]}]}],c={toc:m};function s(e){var n=e.components,t=(0,o.Z)(e,["components"]);return(0,a.kt)("wrapper",(0,r.Z)({},c,t,{components:n,mdxType:"MDXLayout"}),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".ComponentPlayEvent"),(0,a.kt)("p",null,"Interface for component play events."),(0,a.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("p",{parentName:"li"},(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},(0,a.kt)("inlineCode",{parentName:"a"},"ComponentEvent"))),(0,a.kt)("p",{parentName:"li"},"\u21b3 ",(0,a.kt)("strong",{parentName:"p"},(0,a.kt)("inlineCode",{parentName:"strong"},"ComponentPlayEvent"))))),(0,a.kt)("h2",{id:"properties"},"Properties"),(0,a.kt)("h3",{id:"playing"},"playing"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"playing"),": ",(0,a.kt)("inlineCode",{parentName:"p"},"boolean")),(0,a.kt)("p",null,"Value indiciating if the component is playing or not."),(0,a.kt)("h4",{id:"defined-in"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/events/ComponentPlayEvent.ts#L10"},"component/events/ComponentPlayEvent.ts:10")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"target"},"target"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"target"),": ",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.IComponent"},(0,a.kt)("inlineCode",{parentName:"a"},"IComponent"))),(0,a.kt)("p",null,"The component object that fired the event."),(0,a.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},"ComponentEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent#target"},"target")),(0,a.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/events/ComponentEvent.ts#L11"},"component/events/ComponentEvent.ts:11")),(0,a.kt)("hr",null),(0,a.kt)("h3",{id:"type"},"type"),(0,a.kt)("p",null,"\u2022 ",(0,a.kt)("strong",{parentName:"p"},"type"),": ",(0,a.kt)("inlineCode",{parentName:"p"},'"playing"')),(0,a.kt)("p",null,"The event type."),(0,a.kt)("h4",{id:"overrides"},"Overrides"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent"},"ComponentEvent"),".",(0,a.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.ComponentEvent#type"},"type")),(0,a.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/0ab0a161/src/component/events/ComponentPlayEvent.ts#L12"},"component/events/ComponentPlayEvent.ts:12")))}s.isMDXComponent=!0}}]);