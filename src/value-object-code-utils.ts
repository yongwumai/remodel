/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

import Maybe = require('./maybe');
import ObjC = require('./objc');
import ObjCTypeUtils = require('./objc-type-utils');
import StringUtils = require('./string-utils');
import ValueObject = require('./value-object');

function allocationPartOfConstructorInvocationForTypeName(typeName: string): string {
  return typeName + ' alloc';
}

function invocationPartForAttribute(valueGenerator:(attribute:ValueObject.Attribute) => string, attribute: ValueObject.Attribute): string {
  return attribute.name + ':' + valueGenerator(attribute);
}

function invocationPartOfConstructorInvocationForAttributes(attributes: ValueObject.Attribute[], valueGenerator:(attribute:ValueObject.Attribute) => string): string {
  if (attributes.length > 0) {
    return 'initWith' + StringUtils.capitalize(attributes.map(invocationPartForAttribute.bind(null, valueGenerator)).join(' '));
  } else {
    return 'init';
  }
}

export function methodInvocationForConstructor(valueType: ValueObject.Type, valueGenerator:(attribute:ValueObject.Attribute) => string): string {
  const allocationPart = allocationPartOfConstructorInvocationForTypeName(valueType.typeName);
  const invocationPart = invocationPartOfConstructorInvocationForAttributes(valueType.attributes, valueGenerator);
  return '[[' + allocationPart + '] ' + invocationPart + ']';
}

export  function ivarForAttribute(attribute:ValueObject.Attribute):string {
  return '_' + attribute.name;
}

function typeForUnderlyingType(underlyingType:string):ObjC.Type {
  return {
    name: underlyingType,
    reference: underlyingType === 'NSObject' ? 'NSObject*' : underlyingType
  };
}

export function computeTypeOfAttribute(attribute:ValueObject.Attribute):ObjC.Type {
  return Maybe.match(typeForUnderlyingType, function():ObjC.Type {
    return {
      name: attribute.type.name,
      reference: attribute.type.reference
    };
  }, attribute.type.underlyingType);
}

export function propertyOwnershipModifierForAttribute(attribute:ValueObject.Attribute):ObjC.PropertyModifier {
  const type = computeTypeOfAttribute(attribute);
  if (type === null) {
    return ObjC.PropertyModifier.Assign();
  }
  return ObjCTypeUtils.matchType({
    id: function() {
     return ObjC.PropertyModifier.Copy();
    },
    NSObject: function() {
      return ObjC.PropertyModifier.Copy();
    },
    BOOL: function() {
      return ObjC.PropertyModifier.Assign();
    },
    NSInteger: function() {
      return ObjC.PropertyModifier.Assign();
    },
    NSUInteger: function() {
      return ObjC.PropertyModifier.Assign();
    },
    double: function() {
      return ObjC.PropertyModifier.Assign();
    },
    float: function() {
      return ObjC.PropertyModifier.Assign();
    },
    CGFloat: function() {
      return ObjC.PropertyModifier.Assign();
    },
    NSTimeInterval: function() {
      return ObjC.PropertyModifier.Assign();
    },
    uintptr_t: function() {
      return ObjC.PropertyModifier.Assign();
    },
    uint32_t: function() {
      return ObjC.PropertyModifier.Assign();
    },
    uint64_t: function() {
      return ObjC.PropertyModifier.Assign();
    },
    int32_t: function() {
      return ObjC.PropertyModifier.Assign();
    },
    int64_t: function() {
      return ObjC.PropertyModifier.Assign();
    },
    SEL: function() {
      return ObjC.PropertyModifier.Assign();
    },
    NSRange: function() {
      return ObjC.PropertyModifier.Assign();
    },
    CGRect: function() {
      return ObjC.PropertyModifier.Assign();
    },
    CGPoint: function() {
      return ObjC.PropertyModifier.Assign();
    },
    CGSize: function() {
      return ObjC.PropertyModifier.Assign();
    },
    UIEdgeInsets: function() {
      return ObjC.PropertyModifier.Assign();
    },
    Class: function() {
      return ObjC.PropertyModifier.UnsafeUnretained();
    },
    unmatchedType: function() {
      return null;
    }
  }, type);
}

export function shouldCopyIncomingValueForAttribute(attribute:ValueObject.Attribute):boolean {
  const modifier = propertyOwnershipModifierForAttribute(attribute);
  if (modifier === null) {
    return false;
  }
  return modifier.match(function assign() {
                          return false;
                        },
                        function atomic() {
                          return false;
                        },
                        function copy() {
                          return true;
                        },
                        function nonatomic() {
                          return false;
                        },
                        function nonnull() {
                          return false;
                        },
                        function nullable() {
                          return false;
                        },
                        function readonly() {
                          return false;
                        },
                        function readwrite() {
                          return false;
                        },
                        function strong() {
                          return false;
                        },
                        function weak() {
                          return false;
                        },
                        function unsafeUnretained() {
                          return false;
                        });
}
