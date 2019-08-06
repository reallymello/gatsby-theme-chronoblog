const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
const Debug = require('debug');
const mkdirp = require('mkdirp');
const fs = require('fs');
const pkg = require('./package.json');

const debug = Debug(pkg.name);

exports.onPreBootstrap = ({ store }) => {
  const { program } = store.getState();

  const dirs = [
    path.join(program.directory, `feed/posts`),
    path.join(program.directory, `feed/links`),
    path.join(program.directory, `pages`)
  ];

  dirs.forEach((dir) => {
    debug(`Initializing ${dir} directory`);
    if (!fs.existsSync(dir)) {
      mkdirp.sync(dir);
    }
  });
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  if (node.internal.type !== 'Mdx') return;

  const value = path.join('/', createFilePath({ node, getNode }));
  actions.createNodeField({
    name: 'slug',
    node,
    value
  });
};

exports.createPages = async ({ graphql, actions }) => {
  const result = await graphql(`
    {
      allMdx(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
            id
            fields {
              slug
            }
            frontmatter {
              date
              draft
            }
            parent {
              ... on File {
                sourceInstanceName
              }
            }
          }
        }
      }
    }
  `);
  if (result.errors) {
    console.log(result.errors);
    return;
  }
  const posts = result.data.allMdx.edges
    .map((edge) => edge.node)
    .filter((node) => node.parent.sourceInstanceName === 'posts');

  posts.forEach((post) => {
    actions.createPage({
      path: post.fields.slug,
      component: require.resolve('./src/templates/post.js'),
      context: {
        id: post.id
      }
    });
  });
};
