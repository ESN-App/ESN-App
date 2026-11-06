using EsnApp.Application.Common;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record UpdateInfoArticleStatusCommand(Guid Id, InfoArticleStatus Status)
    : IRequest<Result<AdminInfoArticleDto>>;

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
    : IRequestHandler<UpdateInfoArticleStatusCommand, Result<AdminInfoArticleDto>>
{
    public async Task<Result<AdminInfoArticleDto>> Handle(
        UpdateInfoArticleStatusCommand request,
        CancellationToken cancellationToken)
    {
        var article = await repository.GetAdminByIdAsync(request.Id, cancellationToken);
        if (article is null)
            return Result.Failure<AdminInfoArticleDto>($"Info article '{request.Id}' was not found.");

        if (article.Status != InfoArticleStatus.Published
            && request.Status == InfoArticleStatus.Published)
        {
            var published = await repository.GetAdminListAsync(
                InfoArticleStatus.Published, null, cancellationToken);
            // Newly published articles go on top; admins can reorder afterwards.
            article.DisplayOrder = published.Count == 0
                ? 0
                : published.Min(item => item.DisplayOrder) - 1;
        }

        article.Status = request.Status;
        return Result.Success(AdminInfoArticleDto.FromEntity(
            await repository.UpdateAsync(article, cancellationToken)));
    }
}
