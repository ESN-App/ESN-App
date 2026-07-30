using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record UpdateInfoArticleStatusCommand(Guid Id, InfoArticleStatus Status)
    : IRequest<Result<InfoArticleDto>>;

public class UpdateInfoArticleStatusCommandValidator
    : AbstractValidator<UpdateInfoArticleStatusCommand>
{
    public UpdateInfoArticleStatusCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Status).IsInEnum();
    }
}

public class UpdateInfoArticleStatusCommandHandler(IInfoArticleRepository repository)
    : IRequestHandler<UpdateInfoArticleStatusCommand, Result<InfoArticleDto>>
{
    public async Task<Result<InfoArticleDto>> Handle(
        UpdateInfoArticleStatusCommand request,
        CancellationToken cancellationToken)
    {
        var article = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        if (article is null)
            return Result.Failure<InfoArticleDto>($"Info article '{request.Id}' was not found.");

        if (article.Status != InfoArticleStatus.Published
            && request.Status == InfoArticleStatus.Published)
        {
            var published = await repository.GetAdminListAsync(
                InfoArticleStatus.Published, null, cancellationToken);
            article.DisplayOrder = published.Count == 0
                ? 0
                : published.Max(item => item.DisplayOrder) + 1;
        }

        article.Status = request.Status;
        return Result.Success(InfoArticleDto.FromEntity(
            await repository.UpdateAsync(article, cancellationToken)));
    }
}
