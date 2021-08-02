"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[9581],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return u}});var i=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,i)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,i,a=function(e,t){if(null==e)return{};var n,i,a={},r=Object.keys(e);for(i=0;i<r.length;i++)n=r[i],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(i=0;i<r.length;i++)n=r[i],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=i.createContext({}),s=function(e){var t=i.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},c=function(e){var t=s(e.components);return i.createElement(p.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return i.createElement(i.Fragment,{},t)}},d=i.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,p=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),d=s(n),u=a,k=d["".concat(p,".").concat(u)]||d[u]||m[u]||r;return n?i.createElement(k,l(l({ref:t},c),{},{components:n})):i.createElement(k,l({ref:t},c))}));function u(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,l=new Array(r);l[0]=d;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:a,l[1]=o;for(var s=2;s<r;s++)l[s]=n[s];return i.createElement.apply(null,l)}return i.createElement.apply(null,n)}d.displayName="MDXCreateElement"},895:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return o},metadata:function(){return p},toc:function(){return s},default:function(){return m}});var i=n(2122),a=n(9756),r=(n(7294),n(3905)),l={id:"component.OutlineTagOptions",title:"Interface: OutlineTagOptions",sidebar_label:"OutlineTagOptions",custom_edit_url:null},o=void 0,p={unversionedId:"interfaces/component.OutlineTagOptions",id:"interfaces/component.OutlineTagOptions",isDocsHomePage:!1,title:"Interface: OutlineTagOptions",description:"component.OutlineTagOptions",source:"@site/api/interfaces/component.OutlineTagOptions.md",sourceDirName:"interfaces",slug:"/interfaces/component.OutlineTagOptions",permalink:"/mapillary-js/api/interfaces/component.OutlineTagOptions",editUrl:null,version:"current",frontMatter:{id:"component.OutlineTagOptions",title:"Interface: OutlineTagOptions",sidebar_label:"OutlineTagOptions",custom_edit_url:null},sidebar:"api",previous:{title:"MarkerConfiguration",permalink:"/mapillary-js/api/interfaces/component.MarkerConfiguration"},next:{title:"PointerConfiguration",permalink:"/mapillary-js/api/interfaces/component.PointerConfiguration"}},s=[{value:"Properties",id:"properties",children:[{value:"domain",id:"domain",children:[]},{value:"editable",id:"editable",children:[]},{value:"fillColor",id:"fillcolor",children:[]},{value:"fillOpacity",id:"fillopacity",children:[]},{value:"icon",id:"icon",children:[]},{value:"iconFloat",id:"iconfloat",children:[]},{value:"iconIndex",id:"iconindex",children:[]},{value:"indicateVertices",id:"indicatevertices",children:[]},{value:"lineColor",id:"linecolor",children:[]},{value:"lineOpacity",id:"lineopacity",children:[]},{value:"lineWidth",id:"linewidth",children:[]},{value:"text",id:"text",children:[]},{value:"textColor",id:"textcolor",children:[]}]}],c={toc:s};function m(e){var t=e.components,n=(0,a.Z)(e,["components"]);return(0,r.kt)("wrapper",(0,i.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".OutlineTagOptions"),(0,r.kt)("p",null,"Interface for the options that define the behavior and\nappearance of the outline tag."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"interface"))),(0,r.kt)("h2",{id:"properties"},"Properties"),(0,r.kt)("h3",{id:"domain"},"domain"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"domain"),": ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/enums/component.TagDomain"},(0,r.kt)("inlineCode",{parentName:"a"},"TagDomain"))),(0,r.kt)("p",null,"The domain where lines between vertices are treated as straight."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Only applicable for tags that renders polygons."),(0,r.kt)("p",null,"If the domain is specified as two dimensional, editing of the\npolygon will be disabled."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," {TagDomain.TwoDimensional}"),(0,r.kt)("h4",{id:"defined-in"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L21"},"component/tag/interfaces/OutlineTagOptions.ts:21")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"editable"},"editable"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"editable"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Indicate whether the tag geometry should be editable."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Polygon tags with two dimensional domain\nare never editable."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," false"),(0,r.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L31"},"component/tag/interfaces/OutlineTagOptions.ts:31")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"fillcolor"},"fillColor"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"fillColor"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Color for the interior fill as a hexadecimal number."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 0xFFFFFF"),(0,r.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L37"},"component/tag/interfaces/OutlineTagOptions.ts:37")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"fillopacity"},"fillOpacity"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"fillOpacity"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Opacity of the interior fill between 0 and 1."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 0.3"),(0,r.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L43"},"component/tag/interfaces/OutlineTagOptions.ts:43")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"icon"},"icon"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"icon"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"string")),(0,r.kt)("p",null,"A string referencing the sprite data property to pull from."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Icon is not shown for tags with polygon\ngeometries in spherical."),(0,r.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L51"},"component/tag/interfaces/OutlineTagOptions.ts:51")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"iconfloat"},"iconFloat"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"iconFloat"),": ",(0,r.kt)("a",{parentName:"p",href:"/mapillary-js/api/enums/viewer.Alignment"},(0,r.kt)("inlineCode",{parentName:"a"},"Alignment"))),(0,r.kt)("p",null,"Value determining how the icon will float with respect to its anchor\nposition when rendering."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," {Alignment.Center}"),(0,r.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L59"},"component/tag/interfaces/OutlineTagOptions.ts:59")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"iconindex"},"iconIndex"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"iconIndex"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Number representing the index for where to show the icon or\ntext for a rectangle geometry."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," The default index corresponds to the bottom right corner."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 3"),(0,r.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L69"},"component/tag/interfaces/OutlineTagOptions.ts:69")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"indicatevertices"},"indicateVertices"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"indicateVertices"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"boolean")),(0,r.kt)("p",null,"Determines whether vertices should be indicated by points\nwhen tag is editable."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," true"),(0,r.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L77"},"component/tag/interfaces/OutlineTagOptions.ts:77")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"linecolor"},"lineColor"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"lineColor"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Color for the edge lines as a hexadecimal number."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 0xFFFFFF"),(0,r.kt)("h4",{id:"defined-in-8"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L83"},"component/tag/interfaces/OutlineTagOptions.ts:83")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"lineopacity"},"lineOpacity"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"lineOpacity"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Opacity of the edge lines on ","[0, 1]","."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 1"),(0,r.kt)("h4",{id:"defined-in-9"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L89"},"component/tag/interfaces/OutlineTagOptions.ts:89")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"linewidth"},"lineWidth"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"lineWidth"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Line width in pixels."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 1"),(0,r.kt)("h4",{id:"defined-in-10"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L95"},"component/tag/interfaces/OutlineTagOptions.ts:95")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"text"},"text"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"text"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"string")),(0,r.kt)("p",null,"Text shown as label if no icon is provided."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"description"))," Text is not shown for tags with\npolygon geometries in spherical."),(0,r.kt)("h4",{id:"defined-in-11"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L103"},"component/tag/interfaces/OutlineTagOptions.ts:103")),(0,r.kt)("hr",null),(0,r.kt)("h3",{id:"textcolor"},"textColor"),(0,r.kt)("p",null,"\u2022 ",(0,r.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,r.kt)("strong",{parentName:"p"},"textColor"),": ",(0,r.kt)("inlineCode",{parentName:"p"},"number")),(0,r.kt)("p",null,"Text color as hexadecimal number."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"default"))," 0xFFFFFF"),(0,r.kt)("h4",{id:"defined-in-12"},"Defined in"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/component/tag/interfaces/OutlineTagOptions.ts#L109"},"component/tag/interfaces/OutlineTagOptions.ts:109")))}m.isMDXComponent=!0}}]);