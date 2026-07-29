using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record ReorderInfoArticlesCommand(IReadOnlyList<Guid> ArticleIds)
    : IRequest<Result<IReadOnlyList<InfoArticleDto>>>;

public class ReorderInfoArticlesCommandValidator : AbstractValidator<ReorderInfoArticlesCommand>
{
    public ReorderInfoArticlesCommandValidator()
    {
        RuleFor(command => command.ArticleIds)
            .NotEmpty()
            .Must(ids => ids.Distinct().Count() == ids.Count)
            .WithMessage("ArticleIds cannot contain duplicates.");
        RuleForEach(command => command.ArticleIds).NotEmpty();
    }
}

public class ReorderInfoArticlesCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<ReorderInfoArticlesCommand, Result<IReadOnlyList<InfoArticleDto>>>
{
    public async Task<Result<IReadOnlyList<InfoArticleDto>>> Handle(
        ReorderInfoArticlesCommand request,
        CancellationToken cancellationToken)
    {
        var published = await repository.GetAdminListAsync(
            InfoArticleStatus.Published, null, cancellationToken);
        var requestedIds = request.ArticleIds.ToHashSet();
        var publishedIds = published.Select(item => item.Id).ToHashSet();
        if (requestedIds.Count != publishedIds.Count || !requestedIds.SetEquals(publishedIds))
            return Result.Failure<IReadOnlyList<InfoArticleDto>>(
                "ArticleIds must contain every published article exactly once.");

        var byId = published.ToDictionary(item => item.Id);
        for (var index = 0; index < request.ArticleIds.Count; index++)
            byId[request.ArticleIds[index]].DisplayOrder = index;

        await repository.UpdateRangeAsync(published, cancellationToken);
        return Result.Success<IReadOnlyList<InfoArticleDto>>(
            request.ArticleIds.Select(id => InfoArticleDto.FromEntity(byId[id])).ToList());
    }
}
