import { IGenericObject } from "~models/general";
export interface IBaseFlatTree {
  id: string;
  parentId: string;
  title: string;
  slug: string;
}

export interface IBaseCategoryModel {
  id: string;
  slug: string;
  title: string;
  parentId?: string;
  children: IBaseCategoryModel[];
}

export function flattenTree(array: any[]) {
  let result: IGenericObject[] = [];

  array.forEach(function (a) {
    result.push(a);
    if (Array.isArray(a.children)) {
      result = result.concat(flattenTree(a.children));
    }
  });
  return result;
}

export function toTree(items: IBaseFlatTree[], id = null) {
  return items
    .filter((item) => item.parentId === id)
    .map((item) => ({
      ...item,
      children: toTree(items, item.id),
    })).sort((a, b) => {
      //sort by title
      if (a.title < b.title) {
        return -1;
      }

      if (a.title > b.title) {
        return 1;
      }
    });
}


export const createNestedTree = (categories: IBaseCategoryModel[], tree: IBaseCategoryModel[] = [], parentId?: string): IBaseCategoryModel[] => {
  // base case: if categories array is empty, return the tree
  if (categories.length === 0) {
    return tree;
  }

  // take the first category and remove it from the array
  const category = categories.shift() as IBaseCategoryModel;
  category.parentId = parentId;  // set the parent id
  category.children = [];  // initialize an empty children array

  // if tree is empty, set the category as the root node
  if (tree.length === 0) {
    tree.push(category);
  } else {
    // if tree is not empty, add the category as a child node of the deepest node
    let currentNode = tree;
    while (currentNode[0].children.length > 0) {
      currentNode = currentNode[0].children;
    }
    currentNode[0].children.push(category);
  }

  // recursively call createNestedTree with the remaining categories, the current category's slug as parentId, and the updated tree
  return createNestedTree(categories, tree, category.id);
};
