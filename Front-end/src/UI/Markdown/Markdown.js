import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import classes from './Markdown.module.scss';

const Markdown = ({ children }) => (
    <div className={classes.markdown}>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // eslint-disable-next-line jsx-a11y/anchor-has-content
                a: ({ node, ...props }) => <a target="_blank" rel="noreferrer" {...props} />,
            }}
        >
            {children || ''}
        </ReactMarkdown>
    </div>
);

export default Markdown;
